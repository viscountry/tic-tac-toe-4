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
const RECONNECT_TIMEOUT = 3 * 60 * 1000; // 3 minutes

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
    const player = room.players[sym];
    const otherSym = TTF.other(sym);
    const opponent = room.players[otherSym];
    
    send(player, {
      type: 'state',
      code: room.code,
      you: sym,
      yourName: room.playerNames[sym],
      opponentName: room.playerNames[otherSym],
      board: room.board,
      turn: room.turn,
      result: room.result,
      opponentHere: !!opponent,
      rematchVotes: [...room.rematch],
    });
  }
}

function disconnect(ws) {
  const room = ws.room;
  if (!room) return;
  
  const sym = ws.sym;
  ws.room = null;
  
  // Mark disconnect time but keep player data for reconnection
  if (room.players[sym] === ws) {
    room.players[sym] = null;
    room.disconnectTimes[sym] = Date.now();
  }
  
  // Notify the other player
  const otherSym = TTF.other(sym);
  if (room.players[otherSym]) {
    send(room.players[otherSym], {
      type: 'opponent_left',
      opponentName: room.playerNames[sym]
    });
  }
  
  // Don't delete room immediately - allow reconnection
  // Cleanup happens in the interval below
}

function handle(ws, msg) {
  switch (msg.type) {
    case 'create': {
      disconnect(ws);
      const playerName = (msg.playerName || 'Player').trim().slice(0, 15);
      const room = {
        code: makeCode(),
        players: { X: ws, O: null },
        playerNames: { X: playerName, O: null },
        disconnectTimes: { X: null, O: null }
      };
      resetRoom(room);
      rooms.set(room.code, room);
      ws.room = room;
      ws.sym = 'X';
      broadcast(room);
      break;
    }
    
    case 'join': {
      disconnect(ws);
      const room = rooms.get(String(msg.code || '').toUpperCase().trim());
      if (!room) return send(ws, { type: 'error', message: 'No room with that code. Check it and try again.' });
      
      const playerName = (msg.playerName || 'Player').trim().slice(0, 15);
      const sym = !room.players.X ? 'X' : !room.players.O ? 'O' : null;
      if (!sym) return send(ws, { type: 'error', message: 'That room already has two players.' });
      
      room.players[sym] = ws;
      room.playerNames[sym] = playerName;
      room.disconnectTimes[sym] = null;
      ws.room = room;
      ws.sym = sym;
      broadcast(room);
      break;
    }
    
    case 'reconnect': {
      const room = rooms.get(String(msg.code || '').toUpperCase().trim());
      if (!room) return send(ws, { type: 'error', message: 'Room no longer exists or has expired.' });
      
      const playerName = (msg.playerName || 'Player').trim().slice(0, 15);
      const requestedSym = msg.previousSymbol;
      
      // Check if this slot is available for reconnection
      if (requestedSym && (requestedSym === 'X' || requestedSym === 'O')) {
        // If the slot is empty and matches their previous name, allow reconnection
        if (!room.players[requestedSym] && room.playerNames[requestedSym] === playerName) {
          room.players[requestedSym] = ws;
          room.disconnectTimes[requestedSym] = null;
          ws.room = room;
          ws.sym = requestedSym;
          
          // Notify reconnected player
          send(ws, { type: 'reconnected' });
          
          // Notify opponent
          const otherSym = TTF.other(requestedSym);
          if (room.players[otherSym]) {
            send(room.players[otherSym], {
              type: 'opponent_reconnected',
              opponentName: playerName
            });
          }
          
          broadcast(room);
          return;
        }
      }
      
      // Reconnection failed, treat as normal join if room exists, otherwise error
      const sym = !room.players.X ? 'X' : !room.players.O ? 'O' : null;
      if (sym) {
        // Room exists but our slot was taken or name didn't match - join as new player
        room.players[sym] = ws;
        room.playerNames[sym] = playerName;
        room.disconnectTimes[sym] = null;
        ws.room = room;
        ws.sym = sym;
        broadcast(room);
      } else {
        send(ws, { type: 'error', message: 'Room is full. Try creating a new game.' });
      }
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
  ws.on('close', () => disconnect(ws));
});

// Keeps connections alive through Render's proxy and drops dead sockets.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false;
    ws.ping();
  }
}, 30000);

// Clean up rooms where both players have been disconnected for 3+ minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    const xDisconnected = !room.players.X && room.disconnectTimes.X;
    const oDisconnected = !room.players.O && room.disconnectTimes.O;
    
    // If both players are disconnected
    if (xDisconnected && oDisconnected) {
      const xTime = room.disconnectTimes.X || 0;
      const oTime = room.disconnectTimes.O || 0;
      const lastDisconnect = Math.max(xTime, oTime);
      
      // Delete room if 3 minutes have passed since last disconnect
      if (now - lastDisconnect > RECONNECT_TIMEOUT) {
        rooms.delete(code);
      }
    }
    // If room never had a second player and creator left more than 3 minutes ago
    else if (xDisconnected && !room.playerNames.O) {
      if (now - room.disconnectTimes.X > RECONNECT_TIMEOUT) {
        rooms.delete(code);
      }
    }
    else if (oDisconnected && !room.playerNames.X) {
      if (now - room.disconnectTimes.O > RECONNECT_TIMEOUT) {
        rooms.delete(code);
      }
    }
  }
}, 60000); // Check every minute

server.listen(PORT, () => console.log(`Tic-Tac-Four listening on ${PORT}`));
