// SCREAM:WEB multiplayer server v2 (same protocol as the Cloudflare Worker). Serves the game and relays drivers in rooms (max 16).
// Put this file next to scream-premier-speedway.html, then:
//   npm install ws
//   node scream-mp-server.js            (PORT env var, default 8787)
// Open http://localhost:8787 in two tabs (or http://<this machine's IP>:8787 on another device on your wi-fi), then Race > Multiplayer.
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = +process.env.PORT || 8787, MAX = 16, V = 2, GAME = path.join(__dirname, 'scream-premier-speedway.html');
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
// a mild filter for names and chat (the game filters too; this catches anyone who goes round it)
const BADW = ['fuck','fuk','fck','shit','cunt','bitch','bastard','wank','twat','prick','cock','pussy','slut','whore','fag','faggot','nigger','nigga','retard','spastic','rape','nazi','hitler','boong','coon','chink','gook','kike','dyke','tranny','arsehole','asshole','bollock','tosser','bellend','jizz','cum','porn','sex','penis','vagina','tits','boob','anal','arse','piss','crap','damn'];
const BADX = new Set(['rape','cum','sex','anal','arse','piss','crap','damn','cock','coon','fag','tits','boob','prick']);
const LEET = { '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '9': 'g' };
const norm = w => w.toLowerCase().replace(/[01!3@4$578+9]/g, c => LEET[c]).replace(/(.)\1+/g, '$1').replace(/[^a-z]/g, '');
function censor(s) { s = String(s ?? ''); const out = s.replace(/[^\s]+/g, w => { const n = norm(w); if (!n) return w; for (const b of BADW) { const bn = b.replace(/(.)\1+/g, '$1'); if (BADX.has(b) ? n === bn || n === bn + 's' : n.includes(bn)) return '*'.repeat(Math.min(8, w.length)); } return w; });
  if (out === s) { const j = norm(s); for (const b of BADW) if (!BADX.has(b) && (b.length >= 5 || s.trim().split(/\s+/).every(x => x.length <= 2)) && j.includes(b.replace(/(.)\1+/g, '$1'))) return '*'.repeat(Math.min(12, s.length)); } return out; }
const cleanName = (s, n = 24) => { const c = censor(clean(s, n)); return /^[*\s]*$/.test(c) ? 'Driver' : c; };
const rooms = new Map(); let nextId = 1;   // name -> { socks: Set, racing, settings, pub }
// Quicktimes board (same rules as the Worker), kept in lb.json next to this file
const LBF = path.join(__dirname, 'lb.json'); let LB = {}; try { LB = JSON.parse(fs.readFileSync(LBF, 'utf8')); } catch (e) {}
const lbSave = () => fs.writeFile(LBF, JSON.stringify(LB), () => {});
const HITS = new Map();
function lbHandle(req, res) {
  const out = (o, st = 200) => { res.writeHead(st, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'GET,POST,DELETE' }); res.end(JSON.stringify(o)); };
  const u = new URL(req.url, 'http://x'), q = u.searchParams, B = k => (LB['b:' + k] = LB['b:' + k] || []);
  const top = (L, period) => { const m = new Date(); m.setUTCDate(1); m.setUTCHours(0, 0, 0, 0); return L.filter(e => period !== 'month' || e.d >= m.getTime()).slice(0, 10).map(({ dev, ...e }) => e); };
  if (req.method === 'OPTIONS') return out({});
  if (req.method === 'GET' && u.pathname === '/lb/ghost') { const g = LB['g:' + q.get('id')]; return g ? out(g) : out({ error: 'no ghost' }, 404); }
  if (req.method === 'GET') { const board = clean(q.get('board') || 'premier', 60), L = B(board), dev = clean(q.get('dev'), 40), me = dev ? L.findIndex(e => e.dev === dev) : -1;
    return out({ board, top: top(L, q.get('period')), me: me >= 0 ? { rank: me + 1, ...top([L[me]])[0] } : null, n: L.length }); }
  if (req.method === 'DELETE') { if (!process.env.ADMIN_KEY || q.get('key') !== process.env.ADMIN_KEY) return out({ error: 'no' }, 403); const board = clean(q.get('board'), 60); LB['b:' + board] = B(board).filter(e => e.id !== q.get('id')); delete LB['g:' + q.get('id')]; lbSave(); return out({ ok: true }); }
  let body = ''; req.on('data', c => { body += c; if (body.length > 400000) req.destroy(); }); req.on('end', () => {
    const ip = req.socket.remoteAddress, now = Date.now(), H = (HITS.get(ip) || []).filter(t => now - t < 60e3); if (H.length >= 8) return out({ error: 'slow down' }, 429); H.push(now); HITS.set(ip, H);
    let m; try { m = JSON.parse(body); } catch (e) { return out({ error: 'bad json' }, 400); }
    const board = clean(m.board, 60), t = +m.t, len = +m.len, sp = Array.isArray(m.splits) ? m.splits.map(Number) : [];
    if (!board || !(t > 0) || !(len > 200 && len < 3000) || t < len / 46 || t > 120) return out({ error: 'not a real lap' }, 400);
    if (sp.length !== 4 || Math.abs(sp.reduce((a, b) => a + b, 0) - t) > .06 || sp.some(x => !(x >= t * .13))) return out({ error: 'splits do not add up' }, 400);
    const dev = clean(m.dev, 40) || ip, L = B(board), old = L.findIndex(e => e.dev === dev);
    if (old >= 0 && L[old].t <= t) { L[old].name = cleanName(m.name); lbSave(); return out({ rank: old + 1, pb: false, best: L[old].t, n: L.length }); }
    if (old >= 0) { delete LB['g:' + L[old].id]; L.splice(old, 1); }
    const e = { id: now.toString(36) + Math.random().toString(36).slice(2, 6), dev, name: cleanName(m.name), num: clean(m.num, 5), car: clean(m.car, 40), col: /^#[0-9a-f]{6}$/i.test(m.col) ? m.col : '#888888', t: Math.round(t * 1000) / 1000, sp: sp.map(x => Math.round(x * 1000) / 1000), d: now };
    L.push(e); L.sort((a, b) => a.t - b.t); for (const x of L.splice(200)) delete LB['g:' + x.id];
    const rank = L.indexOf(e) + 1; if (rank <= 10 && Array.isArray(m.ghost) && m.ghost.length >= 80 && m.ghost.length <= 24000) { LB['g:' + e.id] = { lap: e.t, p: m.ghost.map(Number) }; e.g = 1; }
    for (const x of L.slice(10)) if (x.g) { delete LB['g:' + x.id]; x.g = 0; }
    lbSave(); out({ rank, pb: true, best: e.t, id: e.id, n: L.length }); });
}
const hostWs = R => { let h = null; for (const o of R.socks) if (!h || o.id < h.id) h = o; return h; };
const pub = o => ({ id: o.id, name: o.info.name, num: o.info.num, col: o.info.col, prof: o.info.prof || null, ready: !!o.info.ready });
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/lb')) { lbHandle(req, res); return; }
  if (req.url.startsWith('/rooms')) { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify([...rooms.entries()].filter(([, R]) => R.pub && R.socks.size).map(([room, R]) => ({ room, n: R.socks.size, host: hostWs(R) ? hostWs(R).info.name : '', racing: R.racing })))); return; }
  if (req.url === '/' || req.url.startsWith('/?') || req.url === '/index.html') {
    fs.readFile(GAME, (err, buf) => { if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Put scream-premier-speedway.html next to scream-mp-server.js'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(buf); });
  } else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
});
const wss = new WebSocketServer({ server, perMessageDeflate: false, maxPayload: 8192 });
const send = (ws, m) => { if (ws.readyState === 1) ws.send(typeof m === 'string' ? m : JSON.stringify(m)); };
const all = (R, m, except) => { const s = typeof m === 'string' ? m : JSON.stringify(m); for (const o of R.socks) if (o !== except) send(o, s); };
wss.on('connection', (ws, req) => {
  ws.id = nextId++; ws.room = null; ws.alive = true; const want = clean(new URL(req.url, 'http://x').searchParams.get('room') || 'premier', 32) || 'premier';
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', (raw, isBinary) => {
    const R = ws.room && rooms.get(ws.room);
    if (isBinary) { if (!R || raw.length < 41 || raw.length > 64 || (raw[0] !== 1 && raw[0] !== 2)) return; if (raw[0] === 2 && hostWs(R) !== ws) return;
      const out = Buffer.allocUnsafe(raw.length + 2); out.writeUInt16LE(ws.id, 0); raw.copy(out, 2);
      for (const o of R.socks) if (o !== ws && o.readyState === 1 && o.bufferedAmount < 65536) o.send(out, { binary: true }); return; }
    if (raw.length > 4096) return; let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'ping') { send(ws, { t: 'pong', c: m.c, st: Date.now() }); return; }
    if (m.t === 'hello' && !ws.room) {
      const name = clean(m.room || want, 32) || want, R2 = rooms.get(name) || { socks: new Set(), racing: false, settings: null, pub: m.pub !== false };
      if (R2.socks.size >= MAX) { send(ws, { t: 'full' }); ws.close(); return; }
      ws.room = name; ws.info = { name: cleanName(m.name || 'Driver'), num: clean(m.num, 5), col: /^#[0-9a-f]{6}$/i.test(m.col) ? m.col : '#888888', prof: m.prof || null, ready: false };
      R2.socks.add(ws); rooms.set(name, R2); const host = hostWs(R2).id;
      send(ws, { t: 'welcome', v: V, id: ws.id, host, peers: [...R2.socks].filter(o => o !== ws).map(pub), racing: R2.racing, settings: R2.settings, st: Date.now() });
      all(R2, { t: 'join', host, ...pub(ws) }, ws); console.log(ws.info.name, 'joined', name, '(' + R2.socks.size + ')'); return; }
    if (!R) return; const isHost = hostWs(R) === ws;
    if (m.t === 'start' && isHost && Array.isArray(m.order)) { R.racing = true; for (const o of R.socks) o.info.ready = false; all(R, { ...m, t: 'start', from: ws.id, laps: Math.max(2, Math.min(50, m.laps | 0)) }, ws); }
    else if (m.t === 'end' && isHost) { R.racing = false; all(R, { t: 'end', from: ws.id }, ws); }
    else if (m.t === 'set' && isHost) { R.settings = m.s || null; all(R, { t: 'set', s: R.settings }, ws); }
    else if (m.t === 'prof') { if (m.name) ws.info.name = cleanName(m.name); if (m.num != null) ws.info.num = clean(m.num, 5); if (/^#[0-9a-f]{6}$/i.test(m.col)) ws.info.col = m.col; if (m.prof) ws.info.prof = m.prof; all(R, { t: 'prof', ...pub(ws) }, ws); }
    else if (m.t === 'ready') { ws.info.ready = !!m.on; all(R, { t: 'ready', id: ws.id, on: ws.info.ready }, ws); }
    else if (m.t === 'x' && typeof m.k === 'string') { const out = JSON.stringify({ t: 'x', from: ws.id, k: m.k.slice(0, 12), d: m.k === 'chat' ? censor(String(m.d || '').slice(0, 140)) : m.d }); if (m.to != null) { for (const o of R.socks) if (o.id === m.to) send(o, out); } else all(R, out, ws); }
    else if (m.t === 's' && Array.isArray(m.s)) all(R, { t: 's', id: ws.id, s: m.s.map(Number) }, ws);
  });
  ws.on('close', () => { const R = ws.room && rooms.get(ws.room); if (!R) return; R.socks.delete(ws); const h = hostWs(R); all(R, { t: 'leave', id: ws.id, host: h ? h.id : null }); if (!R.socks.size) rooms.delete(ws.room); });
});
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 15000);
server.listen(PORT, () => console.log('SCREAM multiplayer v2: open http://localhost:' + PORT + '  (relay on the same port, rooms at /rooms)'));
