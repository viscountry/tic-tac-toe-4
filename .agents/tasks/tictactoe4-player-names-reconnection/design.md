# Technical Design: Player Names & Reconnection System

## Overview

This feature adds player name collection and a reconnection system to the multiplayer Tic-Tac-Four game. Players enter their name before creating or joining a room. The server persists game state in memory, allowing players to reconnect within 3 minutes after disconnection (page refresh, network drop, browser crash). The existing WebSocket protocol is extended with name fields and reconnection messages.

**Technology Stack**: Node.js WebSocket server (ws package), React client, localStorage for session persistence, Tailwind CSS v4 for UI. No database—all state is in-memory on the server.

**Breaking Protocol Change**: The `create` and `join` messages now require a `name` field. Old cached clients without this field will receive a clear error prompting them to refresh. Deploy server first with cache-busting to minimize issues.

---

## 1. Server-Side Data Structure

### Room Object Schema

Each room in the `rooms` Map has this structure:

```javascript
{
  code: 'ABCDE',                    // 5-character room code
  board: [...],                      // 42-element array from TTF.newBoard()
  turn: 'X' | 'O',                   // Current turn
  starter: 'X' | 'O',                // Who started this round
  result: null | { winner, cells } | { draw: true },
  rematch: Set,                      // Set of symbols that voted for rematch
  players: {
    X: WebSocket | null,             // Player X's WebSocket connection
    O: WebSocket | null              // Player O's WebSocket connection
  },
  playerNames: {
    X: string | null,                // Player X's name (normalized: trimmed, lowercased)
    O: string | null                 // Player O's name
  },
  disconnectedAt: {
    X: number | null,                // Timestamp when X disconnected (used for tracking)
    O: number | null                 // Timestamp when O disconnected
  },
  bothDisconnectedAt: number | null  // Timestamp when BOTH players disconnected (for cleanup)
}
```

**Field Lifecycle**:

- `playerNames.X` is set when X creates or joins, cleared when X explicitly leaves
- `playerNames.O` is set when O joins, cleared when O explicitly leaves
- `players.X` is set when X connects, set to `null` when X disconnects (but name persists)
- `disconnectedAt.X` is set when X disconnects, cleared when X reconnects
- `bothDisconnectedAt` is set when the second player disconnects (both `players.X` and `players.O` are null), cleared when either player reconnects. This timestamp is ALWAYS updated to the most recent moment both were disconnected—no check for existing value.

**Important**: The cleanup interval ONLY checks `bothDisconnectedAt`. The `disconnectedAt` map is available for future diagnostics but NOT used for room expiration logic.

---

## 2. Server-Side WebSocket Message Protocol

### 2.1 Modified: `create`

**Client sends**:
```javascript
{ type: 'create', name: 'Alpa' }
```

**Server logic**:
```javascript
case 'create': {
  // Defensive check for old clients
  if (!msg.name) {
    return send(ws, { type: 'error', message: 'This game version requires a name. Please refresh the page.' });
  }
  
  const result = validateName(msg.name);
  if (result.error) {
    return send(ws, { type: 'error', message: result.error });
  }
  const playerName = result.name; // Normalized: trimmed and lowercased
  
  // Clean up any previous room
  disconnect(ws);
  
  const room = {
    code: makeCode(),
    players: { X: ws, O: null },
    playerNames: { X: playerName, O: null },
    disconnectedAt: { X: null, O: null },
    bothDisconnectedAt: null
  };
  resetRoom(room);
  rooms.set(room.code, room);
  
  ws.room = room;
  ws.sym = 'X';
  
  broadcast(room);
  break;
}
```

**Validation**: Uses `validateName(name)` function (see Section 3).

### 2.2 Modified: `join`

**Client sends**:
```javascript
{ type: 'join', code: 'ABCDE', name: 'Sarah' }
```

**Server logic**:
```javascript
case 'join': {
  // Defensive check for old clients
  if (!msg.name) {
    return send(ws, { type: 'error', message: 'This game version requires a name. Please refresh the page.' });
  }
  
  const result = validateName(msg.name);
  if (result.error) {
    return send(ws, { type: 'error', message: result.error });
  }
  const playerName = result.name;
  
  disconnect(ws);
  
  const room = rooms.get(String(msg.code || '').toUpperCase().trim());
  if (!room) {
    return send(ws, { type: 'error', message: 'No room with that code. Check it and try again.' });
  }
  
  const sym = !room.players.X ? 'X' : !room.players.O ? 'O' : null;
  if (!sym) {
    return send(ws, { type: 'error', message: 'That room already has two players.' });
  }
  
  room.players[sym] = ws;
  room.playerNames[sym] = playerName;
  ws.room = room;
  ws.sym = sym;
  
  broadcast(room);
  break;
}
```

**Note**: Duplicate names are allowed (both X and O can be named "Alex"). Reconnection will prioritize the X slot if both have the same name. This is acceptable because the reconnecting user's intent is clear, and if names are identical, the slot doesn't affect gameplay.

### 2.3 New: `reconnect`

**Client sends**:
```javascript
{ type: 'reconnect', code: 'ABCDE', name: 'alpa' }
```

**Server logic**:
```javascript
case 'reconnect': {
  const result = validateName(msg.name);
  if (result.error) {
    return send(ws, { type: 'error', message: result.error });
  }
  const playerName = result.name; // Normalized
  
  const room = rooms.get(String(msg.code || '').toUpperCase().trim());
  if (!room) {
    return send(ws, { type: 'error', message: 'Room expired or not found. Create or join a new room.' });
  }
  
  // Match name to a slot (case-insensitive)
  let matchedSym = null;
  if (room.playerNames.X === playerName && !room.players.X) {
    matchedSym = 'X';
  } else if (room.playerNames.O === playerName && !room.players.O) {
    matchedSym = 'O';
  } else if (room.playerNames.X === playerName && room.players.X) {
    return send(ws, { type: 'error', message: 'Both players are already connected.' });
  } else if (room.playerNames.O === playerName && room.players.O) {
    return send(ws, { type: 'error', message: 'Both players are already connected.' });
  } else if ((room.playerNames.X === null && room.disconnectedAt.X !== null) || 
             (room.playerNames.O === null && room.disconnectedAt.O !== null)) {
    return send(ws, { type: 'error', message: 'That player has left the game. Create or join a new room.' });
  } else {
    return send(ws, { type: 'error', message: 'You were not in this game.' });
  }
  
  // Reconnect the player
  room.players[matchedSym] = ws;
  room.disconnectedAt[matchedSym] = null;
  ws.room = room;
  ws.sym = matchedSym;
  
  // Clear bothDisconnectedAt if either player is now connected
  if (room.players.X || room.players.O) {
    room.bothDisconnectedAt = null;
  }
  
  // Notify the opponent (if connected)
  const otherSym = TTF.other(matchedSym);
  if (room.players[otherSym]) {
    send(room.players[otherSym], {
      type: 'player_reconnected',
      playerName: room.playerNames[matchedSym]
    });
  }
  
  broadcast(room);
  break;
}
```

**Edge Cases**:
- **Room doesn't exist**: Returns "Room expired or not found"
- **Name doesn't match**: Returns "You were not in this game"
- **Name matches but slot is occupied**: Returns "Both players are already connected"
- **Name matches cleared slot** (player left): Returns "That player has left the game"
- **Duplicate names**: Prioritizes X slot, then O slot (first available)

### 2.4 New: `leave`

**Client sends**:
```javascript
{ type: 'leave' }
```

**Server logic**:
```javascript
case 'leave': {
  const room = ws.room;
  if (!room) return;
  
  const sym = ws.sym;
  const otherSym = TTF.other(sym);
  
  // Clear player from room
  room.players[sym] = null;
  room.playerNames[sym] = null;
  room.disconnectedAt[sym] = null;
  ws.room = null;
  ws.sym = null;
  
  // Reset game state
  resetRoom(room);
  
  // Notify opponent BEFORE broadcast
  if (room.players[otherSym]) {
    send(room.players[otherSym], { type: 'opponent_left' });
  }
  
  // Broadcast updated state
  broadcast(room);
  
  // Delete room if both players are gone
  if (!room.players.X && !room.players.O) {
    rooms.delete(room.code);
  }
  break;
}
```

**Note**: This handler does NOT call `disconnect()` to avoid double broadcast. Explicit leave clears the player's name, resets the game, and notifies the opponent with `opponent_left`.

### 2.5 Modified: `state` broadcast

**Server sends**:
```javascript
{
  type: 'state',
  code: 'ABCDE',
  you: 'X',
  board: [...],
  turn: 'X',
  result: null | { winner, cells } | { draw: true },
  opponentHere: true,
  rematchVotes: ['X'],
  playerNames: {
    X: 'alpa',
    O: 'sarah'
  }
}
```

**Changes**: Added `playerNames` field containing both players' normalized names. When player O hasn't joined yet, the structure is:
```javascript
playerNames: { X: 'alpa', O: null }
```

### 2.6 New: `player_reconnected`

**Server sends** (to opponent when someone reconnects):
```javascript
{ type: 'player_reconnected', playerName: 'sarah' }
```

---

## 3. Server-Side Disconnect & Cleanup Logic

### Name Validation Function

```javascript
function validateName(name) {
  if (typeof name !== 'string') {
    return { error: 'Name must be a string' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { error: 'Name cannot be empty' };
  }
  
  if (trimmed.length > 15) {
    return { error: 'Name must be 15 characters or less' };
  }
  
  // Normalize: lowercase for case-insensitive matching
  return { valid: true, name: trimmed.toLowerCase() };
}
```

**Normalization**: All names are trimmed and lowercased for storage and matching. This ensures "Alpa", "alpa", and " ALPA " are treated as the same player.

**Character Counting**: JavaScript string length counts UTF-16 code units, so some emoji count as 2+ characters. This is acceptable—the 15-character limit is a display constraint, not strict Unicode character count.

**No Profanity Filter**: Per user choice ("emoji are fine"), all Unicode characters are allowed.

### Disconnect Handling (Rename `leave` to `disconnect`)

```javascript
function disconnect(ws) {
  const room = ws.room;
  if (!room) return;
  
  const sym = ws.sym;
  
  // Mark player as disconnected
  room.players[sym] = null;
  room.disconnectedAt[sym] = Date.now();
  ws.room = null;
  ws.sym = null;
  
  // If both players are now disconnected, set expiration timer
  if (!room.players.X && !room.players.O) {
    room.bothDisconnectedAt = Date.now(); // Always update, don't check if already set
  }
  
  // Broadcast updated state (opponent sees opponentHere: false)
  broadcast(room);
}
```

**What Opponent Sees**: When a player disconnects, the opponent receives a `state` message with `opponentHere: false`. The opponent CANNOT make moves. The board is frozen until the disconnected player reconnects or 3 minutes pass. No `opponent_left` message is sent—that's only for explicit leave.

### Room Cleanup Interval

```javascript
const CLEANUP_INTERVAL = 60000; // 60 seconds
const TIMEOUT = 180000; // 3 minutes

setInterval(() => {
  const now = Date.now();
  const expiredRooms = [];
  
  for (const [code, room] of rooms.entries()) {
    if (room.bothDisconnectedAt && (now - room.bothDisconnectedAt) > TIMEOUT) {
      expiredRooms.push(code);
    }
  }
  
  for (const code of expiredRooms) {
    rooms.delete(code);
    console.log(`[Cleanup] Deleted room ${code} after ${Math.floor((now - rooms.get(code)?.bothDisconnectedAt || now) / 1000)}s of inactivity`);
  }
}, CLEANUP_INTERVAL);
```

**Cleanup Logic**: The interval ONLY checks `bothDisconnectedAt`. Rooms are deleted when BOTH players are disconnected for 3+ minutes. The `bothDisconnectedAt` timestamp is ALWAYS updated when both players disconnect, ensuring it reflects the most recent moment both were gone simultaneously.

**Important**: The `disconnectedAt` map is NOT used for cleanup—it's for tracking individual player disconnections (available for future diagnostics or UI improvements).

### WebSocket Close Event

Update the `ws.on('close')` handler to call the renamed function:

```javascript
ws.on('close', () => disconnect(ws));
```

---

## 4. Client-Side: Name Input Modal

### New Component: `NameModal.jsx`

Create `src/components/NameModal.jsx`:

```jsx
import { useState } from 'react';
import Button from './Button.jsx';

export default function NameModal({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Name cannot be empty');
      return;
    }
    if (trimmed.length > 15) {
      setError('Name must be 15 characters or less');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl p-6 sm:p-8 w-full max-w-sm border border-border">
        <h3 className="text-xl sm:text-2xl font-bold mb-2">What's your name?</h3>
        <p className="text-sm text-muted mb-4">This helps your friend know who's playing</p>
        
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter your name"
          maxLength={20}
          autoFocus
          className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 mb-2 focus:border-secondary focus:outline-none"
        />
        
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}
        
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="secondary" className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1">Continue</Button>
        </div>
      </div>
    </div>
  );
}
```

**Mobile UX**:
- Modal is centered with adequate padding
- Input field has large touch target (default px-4 py-3 provides 48px height)
- Enter key submits (for desktop)
- Auto-focus on mount (keyboard opens immediately on mobile)
- Max-width ensures readability on all devices

**Validation**: Client-side validation provides instant feedback before sending to server. Server validates authoritatively to prevent malicious clients. Error messages match server validation exactly for consistency.

---

## 5. Client-Side: Modified Hook

### Modified: `src/hooks/useOnlineGame.js`

```javascript
import { useEffect, useRef, useState } from 'react';

export function useOnlineGame(intent, onFatal) {
  const [state, setState] = useState(null);
  const [playerNames, setPlayerNames] = useState({ X: null, O: null });
  const [notice, setNotice] = useState('');
  const [reconnectNotice, setReconnectNotice] = useState('');
  const wsRef = useRef(null);
  const fatal = useRef(onFatal);
  const intentionalClose = useRef(false);
  const hasShownReconnectNotice = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const stateReceived = useRef(false);
  
  fatal.current = onFatal;

  // Show reconnection notice helper
  const showReconnectNotice = (message, duration = 3000) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setReconnectNotice(message);
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectNotice('');
      reconnectTimeoutRef.current = null;
    }, duration);
  };

  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify(intent));
    
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      
      if (m.type === 'state') {
        setState(m);
        stateReceived.current = true;
        
        if (m.playerNames) {
          setPlayerNames(m.playerNames);
        }
        
        setNotice('');
        
        // Write localStorage immediately with data from message
        if (m.code && m.you && m.playerNames && m.playerNames[m.you]) {
          localStorage.setItem('ttt4_session', JSON.stringify({
            roomCode: m.code,
            playerName: m.playerNames[m.you],
            playerSymbol: m.you
          }));
        }
        
        // Show self-reconnection notice (only once)
        if (intent.type === 'reconnect' && !hasShownReconnectNotice.current) {
          showReconnectNotice("You're back in the game!");
          hasShownReconnectNotice.current = true;
        }
      } 
      else if (m.type === 'error') {
        localStorage.removeItem('ttt4_session');
        fatal.current(m.message);
      } 
      else if (m.type === 'opponent_left') {
        setNotice('Your friend left. Share the room code to invite them back.');
      }
      else if (m.type === 'player_reconnected') {
        showReconnectNotice(`${m.playerName} reconnected`);
      }
    };
    
    ws.onclose = () => {
      if (!intentionalClose.current) {
        // Only remove session if state was never received (connection failed before join)
        if (!stateReceived.current) {
          localStorage.removeItem('ttt4_session');
        }
        fatal.current('Connection lost. Create or join a room to try again.');
      }
    };

    return () => {
      intentionalClose.current = true;
      ws.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [intent]);

  const send = (msg) => wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify(msg));
  
  const leave = () => {
    intentionalClose.current = true;
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'leave' }));
    }
    localStorage.removeItem('ttt4_session');
  };
  
  const game = state && {
    ...state,
    playerNames,
    play: (index) => send({ type: 'move', index }),
    rematch: () => send({ type: 'rematch' }),
    rematchWaiting: state.rematchVotes.includes(state.you),
    leave,
  };
  
  return { game, notice, reconnectNotice };
}
```

**Key Changes**:
1. **localStorage write timing**: Written when first `state` message is received with valid data
2. **localStorage clear timing**: Cleared on error, explicit leave, and connection close ONLY if state was never received
3. **Reconnection notices**: Separate state variable `reconnectNotice` with timeout management
4. **Timeout cleanup**: Shared helper function ensures only one timeout runs at a time
5. **intentionalClose ref**: Prevents error message after explicit leave
6. **stateReceived ref**: Tracks whether connection succeeded before close

---

## 6. Client-Side: Modified Screens

### Modified: `src/screens/FriendLobby.jsx`

```jsx
import { useState } from 'react';
import Button from '../components/Button.jsx';
import NameModal from '../components/NameModal.jsx';

export default function FriendLobby({ initialCode, notice, onBack, onStart }) {
  const [code, setCode] = useState(initialCode);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);

  const handleCreateClick = () => {
    setPendingIntent({ type: 'create' });
    setShowNameModal(true);
  };

  const handleJoinClick = () => {
    setPendingIntent({ type: 'join', code });
    setShowNameModal(true);
  };

  const handleNameSubmit = (name) => {
    setShowNameModal(false);
    onStart({ ...pendingIntent, name });
  };

  const handleNameCancel = () => {
    setShowNameModal(false);
    setPendingIntent(null);
  };

  return (
    <section className="min-h-screen flex flex-col px-4 py-6 sm:py-8">
      <Button variant="link" onClick={onBack}>← Back</Button>
      
      <div className="mt-6 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Play with Friend</h2>
        <p className="text-sm sm:text-base text-muted">Multiplayer via room codes</p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-5 sm:space-y-6 max-w-md mx-auto w-full">
        <div className="bg-card rounded-xl p-5 sm:p-6 border border-border">
          <h3 className="font-semibold mb-2">Create Room</h3>
          <p className="text-xs sm:text-sm text-muted mb-4">Get a code to share</p>
          <Button onClick={handleCreateClick}>Create Room</Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-bg px-2 text-muted">or</span>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 sm:p-6 border border-border">
          <h3 className="font-semibold mb-4">Join Room</h3>
          <label htmlFor="code" className="block text-xs sm:text-sm text-muted mb-2">Room Code</label>
          <input
            id="code"
            type="text"
            placeholder="ABCDE"
            maxLength={5}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 text-center text-xl sm:text-2xl tracking-widest font-semibold focus:border-secondary focus:outline-none mb-4"
          />
          <Button onClick={handleJoinClick} disabled={code.length !== 5}>
            Join Room
          </Button>
        </div>

        {notice && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-xs sm:text-sm text-primary">{notice}</p>
          </div>
        )}
      </div>

      {showNameModal && (
        <NameModal onSubmit={handleNameSubmit} onCancel={handleNameCancel} />
      )}
    </section>
  );
}
```

**Flow**:
1. User clicks Create or Join → `showNameModal` set to true, intent stored in `pendingIntent`
2. User enters name → `handleNameSubmit` combines intent with name and calls `onStart`
3. User cancels → modal closes, intent cleared
4. When FriendLobby receives `initialCode` from URL, it pre-fills the code input but waits for user to click Join (which shows name modal)

---

### Modified: `src/screens/OnlineGame.jsx`

```jsx
import GameView from '../components/GameView.jsx';
import { useOnlineGame } from '../hooks/useOnlineGame.js';

export default function OnlineGame({ intent, onLeave, onFatal }) {
  const { game, notice, reconnectNotice } = useOnlineGame(intent, onFatal);

  if (!game) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted">Connecting...</p>
    </div>
  );

  return (
    <>
      <GameView game={game} mode="online" notice={notice} onLeave={onLeave} />
      
      {reconnectNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-4 py-3 shadow-lg animate-fade-in z-50 max-w-[90vw]">
          <p className="text-sm font-medium">{reconnectNotice}</p>
        </div>
      )}
    </>
  );
}
```

**Reconnection Toast**:
- Positioned at `top-4` to avoid mobile browser UI (Safari toolbar, Android address bar)
- `max-w-[90vw]` ensures it fits on small screens
- `z-50` keeps it above game elements
- Uses Tailwind's `animate-fade-in` class (defined in CSS)

---

### Modified: `src/components/GameView.jsx`

```jsx
import { useState } from 'react';
import Board from './Board.jsx';
import Button from './Button.jsx';
import Mark from './Mark.jsx';

export default function GameView({ game, mode, notice, onLeave }) {
  const { board, turn, you, result, opponentHere, code, play, rematch, rematchWaiting, leave, playerNames } = game;
  const [copied, setCopied] = useState(false);
  
  const yourName = playerNames?.[you] || 'You';
  const opponentSym = you === 'X' ? 'O' : 'X';
  const opponentName = playerNames?.[opponentSym] || 'Friend';

  let status;
  if (result) {
    if (result.draw) {
      status = 'Draw!';
    } else if (result.winner === you) {
      status = `${yourName} won!`;
    } else {
      status = `${opponentName} won!`;
    }
  } else if (!opponentHere) {
    status = opponentName === 'Friend' ? 'Waiting...' : `Waiting for ${opponentName}`;
  } else if (turn === you) {
    status = `${yourName}'s turn`;
  } else {
    status = mode === 'bot' ? 'Thinking...' : `${opponentName}'s turn`;
  }

  const canPlay = !result && opponentHere && turn === you;

  const copyLink = () =>
    navigator.clipboard
      ?.writeText(`${location.origin}/?room=${code}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });

  const handleLeave = () => {
    if (mode === 'online' && leave) {
      leave();
      // Give the message time to send before navigating
      setTimeout(() => onLeave(), 100);
    } else {
      onLeave();
    }
  };

  return (
    <section className="min-h-screen flex flex-col px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted">Playing as</span>
          <Mark player={you} className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <Button variant="link" onClick={handleLeave}>Leave</Button>
      </div>

      {mode === 'online' && (
        <div className="mb-4 sm:mb-6 bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-muted mb-1">Room Code</div>
              <div className="text-xl sm:text-2xl font-bold tracking-widest">{code}</div>
            </div>
            <Button variant="link" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</Button>
          </div>
        </div>
      )}

      <div className="text-center mb-4 sm:mb-6">
        <p className="text-lg sm:text-xl font-semibold" aria-live="polite">{status}</p>
      </div>

      <div className="flex justify-center mb-6 flex-1 items-center">
        <Board board={board} winCells={result?.cells} canPlay={canPlay} onPlay={play} />
      </div>

      {result && (
        <div className="mt-auto">
          <Button onClick={rematch} disabled={rematchWaiting}>
            {mode === 'bot' ? 'Play Again' : rematchWaiting ? 'Waiting...' : 'Rematch'}
          </Button>
        </div>
      )}
      
      {notice && (
        <div className="mt-4 bg-card border border-border rounded-lg p-3">
          <p className="text-xs sm:text-sm text-muted">{notice}</p>
        </div>
      )}
    </section>
  );
}
```

**Personalization**:
- Turn status: "alpa's turn" or "sarah's turn"
- Win status: "alpa won!" or "sarah won!"
- Waiting status: "Waiting for sarah" (or "Waiting..." if name unknown)
- Fallbacks: If `playerNames` is missing, falls back to "You" and "Friend"
- Leave button: 100ms delay ensures leave message is sent before navigation

---

### Modified: `src/App.jsx`

```jsx
import { useState, useEffect } from 'react';
import Home from './screens/Home.jsx';
import BotSetup from './screens/BotSetup.jsx';
import FriendLobby from './screens/FriendLobby.jsx';
import BotGame from './screens/BotGame.jsx';
import OnlineGame from './screens/OnlineGame.jsx';

const getInviteCode = () => (new URLSearchParams(location.search).get('room') || '').toUpperCase().slice(0, 5);

export default function App() {
  const [screen, setScreen] = useState('home');
  const [botOpts, setBotOpts] = useState({ level: 'hard', side: 'X' });
  const [intent, setIntent] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // Check for existing session
    const sessionStr = localStorage.getItem('ttt4_session');
    const inviteCode = getInviteCode();
    
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        
        // URL invite conflicts with session
        if (inviteCode && inviteCode !== session.roomCode) {
          localStorage.removeItem('ttt4_session');
          setScreen('friend');
          setIntent({ type: 'join', code: inviteCode }); // FriendLobby will prompt for name
          return;
        }
        
        // Auto-reconnect to existing session
        setScreen('onlineGame');
        setIntent({ type: 'reconnect', code: session.roomCode, name: session.playerName });
      } catch (e) {
        localStorage.removeItem('ttt4_session');
      }
    } else if (inviteCode) {
      // URL invite without session
      setScreen('friend');
      setIntent({ type: 'join', code: inviteCode });
    }
  }, []);

  return (
    <>
      {screen === 'home' && <Home onNavigate={setScreen} />}
      {screen === 'bot' && (
        <BotSetup onBack={() => setScreen('home')} onStart={(o) => { setBotOpts(o); setScreen('botGame'); }} />
      )}
      {screen === 'friend' && (
        <FriendLobby
          initialCode={intent?.type === 'join' ? intent.code : ''}
          notice={notice}
          onBack={() => setScreen('home')}
          onStart={(i) => { setNotice(''); setIntent(i); setScreen('onlineGame'); }}
        />
      )}
      {screen === 'botGame' && <BotGame {...botOpts} onLeave={() => setScreen('home')} />}
      {screen === 'onlineGame' && (
        <OnlineGame
          intent={intent}
          onLeave={() => { 
            window.history.replaceState({}, '', location.pathname);
            setScreen('home'); 
          }}
          onFatal={(msg) => { 
            setNotice(msg); 
            window.history.replaceState({}, '', location.pathname);
            setScreen('friend'); 
          }}
        />
      )}
    </>
  );
}
```

**Auto-Reconnection**:
1. On mount, check for `ttt4_session` in localStorage
2. If session exists and matches URL invite (or no URL), auto-reconnect
3. If session exists but conflicts with URL invite, clear session and go to FriendLobby with pre-filled code
4. FriendLobby will prompt for name before joining the URL invite room

---

## 7. CSS Animation

Add to `src/index.css`:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
```

**Note**: This avoids Tailwind v4 `@theme` complexity and ensures the animation works reliably.

---

## 8. Mobile UX Specifications

### iPhone Focus

**Name Input Modal**:
- Touch target: Input field `px-4 py-3` provides 48px height (meets 44pt minimum)
- Keyboard handling: Auto-focus opens keyboard immediately, Enter key submits
- Layout: Modal padding ensures content isn't obscured by keyboard
- Cancel option: Large "Cancel" button allows easy dismissal

**Reconnection Toast**:
- Position: `top-4` avoids Safari toolbar and Android address bar
- Width: `max-w-[90vw]` ensures it fits on all screen sizes
- Readability: `text-sm` (14px) meets minimum font size
- No layout shift: Fixed position doesn't affect game board

**Touch Targets**:
- All buttons maintain 44pt minimum (Tailwind Button component default)
- Board cells are large (responsive to screen size)
- Room code input: Large text (`text-xl sm:text-2xl`) makes it tappable

### Landscape Mode

All components use responsive classes (`sm:`, flex, and relative units) to adapt to landscape. The board scales based on available space, and modals remain centered.

### Testing Plan

Test on:
- iPhone 14 Pro (notch + Dynamic Island)
- iPhone SE (home button)
- Android Chrome (various screen sizes)
- Both portrait and landscape orientations

Verify:
- Name modal visible with keyboard open
- Toast not hidden by browser UI
- Board playable in all orientations
- No horizontal scroll

---

## 9. Edge Cases & Error Handling

### Server-Side

| Scenario | Behavior |
|----------|----------|
| Old client sends `create` without `name` | Error: "This game version requires a name. Please refresh the page." |
| Name validation fails | Error: "Name cannot be empty" or "Name must be 15 characters or less" |
| Reconnect to expired room | Error: "Room expired or not found. Create or join a new room." |
| Reconnect with wrong name | Error: "You were not in this game." |
| Reconnect when both players connected | Error: "Both players are already connected." |
| Reconnect to slot where player left | Error: "That player has left the game. Create or join a new room." |
| Player disconnects | Opponent sees `opponentHere: false`, board frozen, no moves allowed |
| Player explicitly leaves | Game resets, opponent sees "Your friend left" notice |
| Both players disconnect | Room persists for 3 minutes, then deleted by cleanup interval |

### Client-Side

| Scenario | Behavior |
|----------|----------|
| WebSocket closes before first `state` | localStorage never written, reconnection impossible (expected) |
| Connection lost after join | localStorage cleared, user sees "Connection lost" error |
| URL invite conflicts with session | Session cleared, go to FriendLobby with pre-filled code, prompt for name |
| Opponent reconnects | Toast shows "[name] reconnected" for 3 seconds |
| Self reconnects | Toast shows "You're back in the game!" for 3 seconds |
| Multiple rapid reconnections | New toast replaces previous, timer resets |
| User clicks Leave | Message sent, 100ms delay, then navigate (ensures delivery) |

---

## 10. Implementation Order

1. **Server: Add `validateName` function** (Section 3)
2. **Server: Rename `leave` to `disconnect`** (Section 3)
3. **Server: Modify `create` handler** (Section 2.1)
4. **Server: Modify `join` handler** (Section 2.2)
5. **Server: Add `reconnect` handler** (Section 2.3)
6. **Server: Add `leave` handler** (Section 2.4)
7. **Server: Add room cleanup interval** (Section 3)
8. **Server: Modify `broadcast` to include `playerNames`** (Section 2.5)
9. **Client: Create `NameModal.jsx`** (Section 4)
10. **Client: Modify `FriendLobby.jsx`** (Section 6)
11. **Client: Modify `useOnlineGame.js`** (Section 5)
12. **Client: Modify `App.jsx`** (Section 6)
13. **Client: Modify `OnlineGame.jsx`** (Section 6)
14. **Client: Modify `GameView.jsx`** (Section 6)
15. **Client: Add CSS animation** (Section 7)
16. **Testing: Server + client integration** (all reconnection flows)
17. **Testing: Mobile UX** (iPhone, Android, landscape)

---

## 11. Open Questions

None. All ambiguities from the design review have been resolved.

---

## 12. Design Review Response Summary

### HIGH Findings Addressed

**HIGH-1 (3-Minute Cleanup Logic)**: Removed all references to using `lastActivity` for cleanup. Cleanup interval ONLY checks `bothDisconnectedAt`. Added clear specification that `bothDisconnectedAt` is always updated when both players disconnect.

**HIGH-2 (Server leave Function Behavior)**: Specified exactly what opponent sees during disconnect: `opponentHere: false`, board frozen, no moves allowed, no `opponent_left` message. The `opponent_left` message is ONLY sent on explicit leave.

**HIGH-3 (localStorage Race Condition)**: Added specification for `playerNames` structure when O hasn't joined: `{ X: 'name', O: null }`. Added localStorage clear in `onclose` handler only if `state` was never received (tracked by `stateReceived` ref). Added guards for `m.code` and `m.playerNames[m.you]` existence.

**HIGH-4 (Reconnection Matching Ambiguity)**: All names are normalized with `.toLowerCase().trim()` for matching. Duplicate names prioritize X slot (first available). Added specific error for when name matches cleared slot. Case-insensitive matching explicitly specified.

**HIGH-5 (App.jsx URL Invite Conflict)**: Changed to `setScreen('friend')` instead of `onlineGame` when URL invite conflicts with session. FriendLobby receives `{ type: 'join', code: inviteCode }` (no name field), which triggers name prompt before joining.

### MEDIUM Findings Addressed

**MEDIUM-1 (Breaking Change Impact)**: Added defensive check in `create` and `join` handlers: `if (!msg.name) return error`. Error message prompts user to refresh. Deployment plan: server first with cache-busting.

**MEDIUM-2 (bothDisconnectedAt Edge Case)**: Removed the `if (!room.bothDisconnectedAt)` check. Now always updates `room.bothDisconnectedAt = Date.now()` when both players are disconnected. This ensures the timestamp always reflects the most recent moment both were gone.

**MEDIUM-3 (Explicit Leave Double Broadcast)**: Removed call to `disconnect()` inside leave handler. Inlined cleanup to avoid double broadcast. Ensured `opponent_left` is sent before `broadcast()`.

**MEDIUM-4 (Client Leave Race Condition)**: Added `intentionalClose` ref accessible to `leave` function. Set before sending leave message. Checked in `onclose` handler to avoid calling `onFatal` after intentional leave.

**MEDIUM-5 (GameView Leave Button Ordering)**: Added 100ms delay between `leave()` and `onLeave()` to ensure message delivery. Tradeoff explicitly noted in design.

**MEDIUM-6 (Reconnection Notice Timing)**: Added shared `showReconnectNotice` helper that clears previous timeout before setting new one. Cleanup of timeout in `useEffect` return. Only one notice shown at a time.

**MEDIUM-7 (Mobile Toast Positioning)**: Changed toast position to `top-4` for better cross-device compatibility. Avoids Safari toolbar and Android address bar. Added `max-w-[90vw]` for small screens. Testing plan includes iPhone/Android and both orientations.

### NIT Findings Addressed

**NIT-1 (Validation Return Type)**: Changed to return `{ error: string }` or `{ valid: true, name: string }` for clear discrimination.

**NIT-2 (Tailwind Animation Syntax)**: Defined `.animate-fade-in` class explicitly with `@keyframes` outside `@theme` to ensure compatibility.

**NIT-3 (Duplicate Name Recommendation)**: Added note that duplicate names create ambiguous messages. Mentioned this is acceptable per design decision.

**NIT-4 (Implementation Order)**: Reordered to build server changes first, then all client changes, then integrated testing.

**NIT-5 (Console Log Format)**: Used consistent format: `[Cleanup] Deleted room ${code} after ${time}s of inactivity`.

**NIT-6 (Input Sanitization)**: Specified that `trim()` removes newlines/tabs, emoji count as UTF-16 code units (acceptable), no profanity filter (user allowed emoji).

**NIT-7 (Error Message Consistency)**: Added note that client and server use identical error messages for consistency.
