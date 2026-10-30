// SCREAM:WEB multiplayer server (first step). Serves the game and relays car states between drivers in a room (max 16).
// Put this file next to scream-premier-speedway.html, then:
//   npm install ws
//   node scream-mp-server.js            (PORT env var, default 8787)
// Open http://localhost:8787 in two tabs (or http://<this machine's IP>:8787 on another device on your wi-fi),
// Options > Multiplayer > Connect in each, then start a race in each.
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = +process.env.PORT || 8787, MAX = 16, GAME = path.join(__dirname, 'scream-premier-speedway.html');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url.startsWith('/?') || req.url === '/index.html') {
    fs.readFile(GAME, (err, buf) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Put scream-premier-speedway.html next to scream-mp-server.js'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(buf);
    });
  } else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
});

const rooms = new Map(); let nextId = 1;
const hostOf = R => R && R.size ? Math.min(...[...R].map(o => o.id)) : null;   // the longest-standing driver in the room starts races
const wss = new WebSocketServer({ server, perMessageDeflate: false, maxPayload: 4096 });
const send = (ws, m) => { if (ws.readyState === 1) ws.send(typeof m === 'string' ? m : JSON.stringify(m)); };
wss.on('connection', (ws, req) => {
  ws.id = nextId++; ws.room = null; ws.alive = true;
  console.log('driver', ws.id, 'connected from', req.socket.remoteAddress);
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', (raw, isBinary) => {
    if (isBinary) {   // a car state: 41 bytes; pass it on with the sender's id in front
      if (!ws.room || raw.length !== 41 || raw[0] !== 1) return; const out = Buffer.allocUnsafe(43); out.writeUInt16LE(ws.id, 0); raw.copy(out, 2);
      for (const o of rooms.get(ws.room)) if (o !== ws && o.readyState === 1 && o.bufferedAmount < 65536) o.send(out, { binary: true }); return; }
    if (raw.length > 2048) return; let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'hello' && !ws.room) {
      const name = String(m.room || 'premier').slice(0, 32), R = rooms.get(name) || new Set();
      if (R.size >= MAX) { send(ws, { t: 'full' }); ws.close(); return; }
      ws.room = name; ws.info = { id: ws.id, name: String(m.name || 'Driver').slice(0, 24), num: String(m.num || '').slice(0, 4), col: /^#[0-9a-f]{6}$/i.test(m.col) ? m.col : '#888888' };
      R.add(ws); rooms.set(name, R); const host = hostOf(R);
      send(ws, { t: 'welcome', id: ws.id, host, peers: [...R].filter(o => o !== ws).map(o => o.info) });
      for (const o of R) if (o !== ws) send(o, { t: 'join', host, ...ws.info });
      console.log(ws.info.name, 'joined room', name, '(' + R.size + ' in it)');
    } else if (m.t === 'start' && ws.room && ws.id === hostOf(rooms.get(ws.room)) && Array.isArray(m.order)) {
      const out = JSON.stringify({ t: 'start', from: ws.id, laps: Math.max(2, Math.min(50, m.laps | 0)), order: m.order.map(Number).slice(0, 16), names: m.names || {} });
      for (const o of rooms.get(ws.room)) if (o !== ws) send(o, out);
    } else if (m.t === 's' && ws.room && Array.isArray(m.s) && m.s.length >= 8 && m.s.length <= 12) {
      const out = JSON.stringify({ t: 's', id: ws.id, s: m.s.map(Number) });
      for (const o of rooms.get(ws.room)) if (o !== ws) send(o, out);
    }
  });
  ws.on('close', () => { const R = ws.room && rooms.get(ws.room); if (!R) return; R.delete(ws); const host = hostOf(R); for (const o of R) send(o, { t: 'leave', id: ws.id, host }); if (!R.size) rooms.delete(ws.room); console.log('driver', ws.id, 'left'); });
});
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 15000);
server.listen(PORT, () => console.log('SCREAM multiplayer: open http://localhost:' + PORT + '  (relay on the same port)'));
