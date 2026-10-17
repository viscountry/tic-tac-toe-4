import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import express from 'express';
import { WebSocketServer } from 'ws';
import * as TTF from '../src/shared/game.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('/healthz', (_req, res) => res.send('ok'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 });

// All game state lives in memory: code -> room. No database.
const rooms = new Map();
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function makeCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  } while (rooms.has(code));
  return code;
}

const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };

function resetRoom(room, starter = 'X') {
  room.board = TTF.newBoard();
  room.starter = starter;
  room.turn = starter;
  room.result = null;
  room.rematch = new Set();
}

function broadcast(room) {
  for (const sym of ['X', 'O']) {
    send(room.players[sym], {
      type: 'state',
      code: room.code,
      you: sym,
      board: room.board,
      turn: room.turn,
      result: room.result,
      opponentHere: !!room.players[TTF.other(sym)],
      rematchVotes: [...room.rematch],
    });
  }
}

function leave(ws) {
  const room = ws.room;
  if (!room) return;
  ws.room = null;
  if (room.players[ws.sym] === ws) room.players[ws.sym] = null;
  if (!room.players.X && !room.players.O) { rooms.delete(room.code); return; }
  resetRoom(room);
  send(room.players[TTF.other(ws.sym)], { type: 'opponent_left' });
  broadcast(room);
}

function handle(ws, msg) {
  switch (msg.type) {
    case 'create': {
      leave(ws);
      const room = { code: makeCode(), players: { X: ws, O: null } };
      resetRoom(room);
      rooms.set(room.code, room);
      ws.room = room; ws.sym = 'X';
      broadcast(room);
      break;
    }
    case 'join': {
      leave(ws);
      const room = rooms.get(String(msg.code || '').toUpperCase().trim());
      if (!room) return send(ws, { type: 'error', message: 'No room with that code. Check it and try again.' });
      const sym = !room.players.X ? 'X' : !room.players.O ? 'O' : null;
      if (!sym) return send(ws, { type: 'error', message: 'That room already has two players.' });
      room.players[sym] = ws;
      ws.room = room; ws.sym = sym;
      broadcast(room);
      break;
    }
    case 'move': {
      const room = ws.room;
      const i = msg.index;
      if (!room || room.result || !room.players.X || !room.players.O) return;
      if (room.turn !== ws.sym || !Number.isInteger(i) || i < 0 || i >= room.board.length || room.board[i]) return;
      room.board[i] = ws.sym;
      const w = TTF.findWin(room.board);
      if (w) room.result = { winner: w.player, cells: w.cells };
      else if (TTF.isFull(room.board)) room.result = { draw: true };
      else room.turn = TTF.other(room.turn);
      broadcast(room);
      break;
    }
    case 'rematch': {
      const room = ws.room;
      if (!room || !room.result) return;
      room.rematch.add(ws.sym);
      if (room.rematch.size === 2) resetRoom(room, TTF.other(room.starter));
      broadcast(room);
      break;
    }
  }
}

wss.on('connection', (ws) => {
  ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }
    if (msg && typeof msg === 'object') handle(ws, msg);
  });
  ws.on('close', () => leave(ws));
});

// Keeps connections alive through Render's proxy and drops dead sockets.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false;
    ws.ping();
  }
}, 30000);

server.listen(PORT, () => console.log(`Tic-Tac-Four listening on ${PORT}`));
