// SCREAM:WEB multiplayer server v2 (same protocol as the Cloudflare Worker). Serves the game and relays drivers in rooms (max 16).
// Put this file next to scream-premier-speedway.html, then:
//   npm install ws
//   node scream-mp-server.js            (PORT env var, default 8787)
// Open http://localhost:8787 in two tabs (or http://<this machine's IP>:8787 on another device on your wi-fi), then Race > Multiplayer.
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = +process.env.PORT || 8787, MAX = 16, V = 2, GAME = path.join(__dirname, 'scream-premier-speedway.html');
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
const rooms = new Map(); let nextId = 1;   // name -> { socks: Set, racing, settings, pub }
const hostWs = R => { let h = null; for (const o of R.socks) if (!h || o.id < h.id) h = o; return h; };
const pub = o => ({ id: o.id, name: o.info.name, num: o.info.num, col: o.info.col, prof: o.info.prof || null, ready: !!o.info.ready });
const server = http.createServer((req, res) => {
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
      ws.room = name; ws.info = { name: clean(m.name || 'Driver', 24) || 'Driver', num: clean(m.num, 5), col: /^#[0-9a-f]{6}$/i.test(m.col) ? m.col : '#888888', prof: m.prof || null, ready: false };
      R2.socks.add(ws); rooms.set(name, R2); const host = hostWs(R2).id;
      send(ws, { t: 'welcome', v: V, id: ws.id, host, peers: [...R2.socks].filter(o => o !== ws).map(pub), racing: R2.racing, settings: R2.settings, st: Date.now() });
      all(R2, { t: 'join', host, ...pub(ws) }, ws); console.log(ws.info.name, 'joined', name, '(' + R2.socks.size + ')'); return; }
    if (!R) return; const isHost = hostWs(R) === ws;
    if (m.t === 'start' && isHost && Array.isArray(m.order)) { R.racing = true; for (const o of R.socks) o.info.ready = false; all(R, { ...m, t: 'start', from: ws.id, laps: Math.max(2, Math.min(50, m.laps | 0)) }, ws); }
    else if (m.t === 'end' && isHost) { R.racing = false; all(R, { t: 'end', from: ws.id }, ws); }
    else if (m.t === 'set' && isHost) { R.settings = m.s || null; all(R, { t: 'set', s: R.settings }, ws); }
    else if (m.t === 'prof') { if (m.name) ws.info.name = clean(m.name, 24) || ws.info.name; if (m.num != null) ws.info.num = clean(m.num, 5); if (/^#[0-9a-f]{6}$/i.test(m.col)) ws.info.col = m.col; if (m.prof) ws.info.prof = m.prof; all(R, { t: 'prof', ...pub(ws) }, ws); }
    else if (m.t === 'ready') { ws.info.ready = !!m.on; all(R, { t: 'ready', id: ws.id, on: ws.info.ready }, ws); }
    else if (m.t === 'x' && typeof m.k === 'string') { const out = JSON.stringify({ t: 'x', from: ws.id, k: m.k.slice(0, 12), d: m.d }); if (m.to != null) { for (const o of R.socks) if (o.id === m.to) send(o, out); } else all(R, out, ws); }
    else if (m.t === 's' && Array.isArray(m.s)) all(R, { t: 's', id: ws.id, s: m.s.map(Number) }, ws);
  });
  ws.on('close', () => { const R = ws.room && rooms.get(ws.room); if (!R) return; R.socks.delete(ws); const h = hostWs(R); all(R, { t: 'leave', id: ws.id, host: h ? h.id : null }); if (!R.socks.size) rooms.delete(ws.room); });
});
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 15000);
server.listen(PORT, () => console.log('SCREAM multiplayer v2: open http://localhost:' + PORT + '  (relay on the same port, rooms at /rooms)'));
