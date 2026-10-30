// SCREAM:WEB multiplayer relay (first step). Rooms of up to 16 drivers; each car's state is passed on to the others in the room.
// Run:  npm install ws  &&  node scream-mp-server.js   (PORT env var, default 8787)
// In the game: Options > Multiplayer, server ws://<this machine>:8787 (wss:// behind TLS if the game is served over https).
const { WebSocketServer } = require('ws');
const PORT = +process.env.PORT || 8787, MAX = 16;
const rooms = new Map(); let nextId = 1;
const wss = new WebSocketServer({ port: PORT });
const send = (ws, m) => { if (ws.readyState === 1) ws.send(typeof m === 'string' ? m : JSON.stringify(m)); };
wss.on('connection', ws => {
  ws.id = nextId++; ws.room = null; ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => {
    if (raw.length > 2048) return; let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'hello' && !ws.room) {
      const name = String(m.room || 'premier').slice(0, 32), R = rooms.get(name) || new Set();
      if (R.size >= MAX) { send(ws, { t: 'full' }); ws.close(); return; }
      ws.room = name; ws.info = { id: ws.id, name: String(m.name || 'Driver').slice(0, 24), num: String(m.num || '').slice(0, 4), col: /^#[0-9a-f]{6}$/i.test(m.col) ? m.col : '#888888' };
      send(ws, { t: 'welcome', id: ws.id, peers: [...R].map(o => o.info) });
      for (const o of R) send(o, { t: 'join', ...ws.info });
      R.add(ws); rooms.set(name, R);
    } else if (m.t === 's' && ws.room && Array.isArray(m.s) && m.s.length === 8) {
      const out = JSON.stringify({ t: 's', id: ws.id, s: m.s.map(Number) });
      for (const o of rooms.get(ws.room)) if (o !== ws) send(o, out);
    }
  });
  ws.on('close', () => { const R = ws.room && rooms.get(ws.room); if (!R) return; R.delete(ws); for (const o of R) send(o, { t: 'leave', id: ws.id }); if (!R.size) rooms.delete(ws.room); });
});
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 15000);
console.log('SCREAM multiplayer relay on :' + PORT);
