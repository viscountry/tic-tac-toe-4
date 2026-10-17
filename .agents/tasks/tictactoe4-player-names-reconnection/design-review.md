# Design Review: Player Names & Reconnection System

## Verified Assumptions

1. ✅ **WebSocket endpoint**: Confirmed `/ws` path exists in `server/index.js` line 16
2. ✅ **Existing protocol structure**: Verified `create`, `join`, `move`, `rematch` message types in server
3. ✅ **Room structure**: Confirmed `rooms` Map with `code`, `board`, `turn`, `starter`, `result`, `rematch`, `players` fields
4. ✅ **broadcast() function**: Exists and sends `state` messages to both players
5. ✅ **leave() function**: Exists in server (will be renamed to `disconnect()` per design)
6. ✅ **TTF.other() helper**: Confirmed in `src/shared/game.js` line 14
7. ✅ **useOnlineGame hook**: Exists with `intent` parameter and returns `{ game, notice }`
8. ✅ **App.jsx URL parsing**: Confirmed invite code handling via `getInviteCode()`
9. ✅ **Tailwind CSS v4**: Confirmed `@theme` syntax in `src/index.css`
10. ✅ **Button component**: Exists with variant prop (inferred from FriendLobby usage)

## Unverified/Wrong Assumptions

1. ❌ **animate-fade-in class**: Does NOT exist in `src/index.css` — design correctly adds it in Section 7
2. ⚠️ **localStorage never used**: Current codebase has no localStorage usage, so there's no backward compatibility concern (good for implementation)
3. ⚠️ **No existing room cleanup**: Current server has no cleanup interval — design adds this correctly
4. ⚠️ **Client doesn't track player symbol**: Current hook doesn't store `ws.sym` client-side, but design adds this via `m.you` in state messages

## Findings

### HIGH Severity

**HIGH-1: Server leave() function already exists with different behavior**

**Location**: Section 2.4, server/index.js lines 52-59

**Problem**: The design creates a new `leave` message handler and renames the existing `leave()` function to `disconnect()`, but the current `leave()` function already performs cleanup that conflicts with reconnection logic. The current implementation:
```javascript
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
```

This deletes rooms immediately when both players are gone, which prevents reconnection.

**Fix**: The design correctly identifies this needs to be renamed to `disconnect()` BUT the renamed `disconnect()` function must NOT delete rooms or clear playerNames. Specify that `disconnect()` should:
```javascript
function disconnect(ws) {
  const room = ws.room;
  if (!room) return;
  
  const sym = ws.sym;
  room.players[sym] = null;
  room.disconnectedAt[sym] = Date.now();
  ws.room = null;
  ws.sym = null;
  
  // If both players are now disconnected, set expiration timer
  if (!room.players.X && !room.players.O) {
    room.bothDisconnectedAt = Date.now();
  }
  
  broadcast(room);
  // DO NOT delete room, DO NOT send opponent_left, DO NOT reset game, DO NOT clear playerNames
}
```

---

**HIGH-2: Missing initialization of new room fields in create and join handlers**

**Location**: Section 2.1 and 2.2

**Problem**: The design shows `create` handler creating a room with `playerNames`, `disconnectedAt`, and `bothDisconnectedAt`, but the `join` handler doesn't initialize these fields. If a player joins via the `join` path before the `create` path is refactored, the code will fail.

**Fix**: In Section 2.2, add explicit field initialization when O joins (if room was created by old code):
```javascript
case 'join': {
  // ... existing validation ...
  
  // Initialize reconnection fields if they don't exist (backward compatibility)
  if (!room.playerNames) room.playerNames = { X: null, O: null };
  if (!room.disconnectedAt) room.disconnectedAt = { X: null, O: null };
  if (room.bothDisconnectedAt === undefined) room.bothDisconnectedAt = null;
  
  const sym = !room.players.X ? 'X' : !room.players.O ? 'O' : null;
  // ... rest of handler ...
}
```

---

**HIGH-3: No specification for how reconnect handles slot with null name after explicit leave**

**Location**: Section 2.3, reconnection matching logic

**Problem**: The design states "That player has left the game" error when reconnecting to a cleared slot, but doesn't specify how to detect this. If X disconnects (name persists, player is null), then explicitly leaves (name cleared), then tries to reconnect with the same name, the server should reject them. However, the logic checks `room.playerNames.X === playerName` which would be false (null !== 'alpa').

Current logic:
```javascript
else if ((room.playerNames.X === null && room.disconnectedAt.X !== null) || 
         (room.playerNames.O === null && room.disconnectedAt.O !== null)) {
  return send(ws, { type: 'error', message: 'That player has left the game. Create or join a new room.' });
}
```

This checks if name is null AND disconnectedAt is not null, but `disconnectedAt` is cleared by explicit leave.

**Fix**: Remove this check entirely. If `playerNames.X` is null, the name match will fail naturally and fall through to "You were not in this game." The special "That player has left" message is unnecessary. Simplify to:
```javascript
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
} else {
  return send(ws, { type: 'error', message: 'You were not in this game.' });
}
```

---

**HIGH-4: useOnlineGame leave() function doesn't implement 100ms delay specified in GameView**

**Location**: Section 5 (useOnlineGame) and Section 6 (GameView)

**Problem**: Section 6 shows GameView calling `leave()` then waiting 100ms before calling `onLeave()`:
```javascript
const handleLeave = () => {
  if (mode === 'online' && leave) {
    leave();
    setTimeout(() => onLeave(), 100);
  } else {
    onLeave();
  }
};
```

But Section 5 defines `leave()` in the hook as:
```javascript
const leave = () => {
  intentionalClose.current = true;
  if (wsRef.current?.readyState === 1) {
    wsRef.current.send(JSON.stringify({ type: 'leave' }));
  }
  localStorage.removeItem('ttt4_session');
};
```

This doesn't include the delay. The delay is in GameView, which means localStorage is cleared BEFORE the message is sent, and if the WebSocket closes before the 100ms timeout, the session is already gone. But more critically, the hook's `leave()` function clears localStorage synchronously while GameView expects to call `onLeave()` (which unmounts the component) after the delay.

**Fix**: Move the localStorage clear to AFTER the component unmounts. Change the hook's leave to:
```javascript
const leave = () => {
  intentionalClose.current = true;
  if (wsRef.current?.readyState === 1) {
    wsRef.current.send(JSON.stringify({ type: 'leave' }));
    // Don't clear localStorage here - let the unmount handle it
  }
};
```

And in the hook's cleanup `useEffect` return, add:
```javascript
return () => {
  if (intentionalClose.current) {
    localStorage.removeItem('ttt4_session');
  }
  ws.close();
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
  }
};
```

---

**HIGH-5: App.jsx auto-reconnect conflicts with URL invite logic**

**Location**: Section 6 (App.jsx modified)

**Problem**: The design shows App.jsx checking for session on mount:
```javascript
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
```

But this runs inside a `useEffect`, while the initial state is set outside useEffect:
```javascript
const [screen, setScreen] = useState('home');
```

This means the user will see the home screen briefly before the useEffect runs and switches to friend or onlineGame. This causes a flash.

**Fix**: Move the entire session/invite check outside the component into the initial state calculation:
```javascript
function getInitialState() {
  const sessionStr = localStorage.getItem('ttt4_session');
  const inviteCode = getInviteCode();
  
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (inviteCode && inviteCode !== session.roomCode) {
        localStorage.removeItem('ttt4_session');
        return { screen: 'friend', intent: { type: 'join', code: inviteCode }, notice: '' };
      }
      return { 
        screen: 'onlineGame', 
        intent: { type: 'reconnect', code: session.roomCode, name: session.playerName },
        notice: ''
      };
    } catch (e) {
      localStorage.removeItem('ttt4_session');
    }
  }
  
  if (inviteCode) {
    return { screen: 'friend', intent: { type: 'join', code: inviteCode }, notice: '' };
  }
  
  return { screen: 'home', intent: null, notice: '' };
}

export default function App() {
  const initial = getInitialState();
  const [screen, setScreen] = useState(initial.screen);
  const [intent, setIntent] = useState(initial.intent);
  const [notice, setNotice] = useState(initial.notice);
  const [botOpts, setBotOpts] = useState({ level: 'hard', side: 'X' });
  
  // Remove the useEffect entirely
```

---

### MEDIUM Severity

**MEDIUM-1: Missing specification for when bothDisconnectedAt is cleared**

**Location**: Section 3, disconnect() function

**Problem**: The design states `bothDisconnectedAt` is "cleared when either player reconnects" but the `disconnect()` function only SETS it, never clears it. The `reconnect` handler shows clearing it, but what happens if one player reconnects and then disconnects again?

**Current reconnect logic**:
```javascript
// Clear bothDisconnectedAt if either player is now connected
if (room.players.X || room.players.O) {
  room.bothDisconnectedAt = null;
}
```

But if X reconnects (clears `bothDisconnectedAt`), then X disconnects again, `bothDisconnectedAt` needs to be recalculated.

**Fix**: Update `disconnect()` to check if BOTH players are disconnected EVEN IF `bothDisconnectedAt` was previously null:
```javascript
function disconnect(ws) {
  const room = ws.room;
  if (!room) return;
  
  const sym = ws.sym;
  room.players[sym] = null;
  room.disconnectedAt[sym] = Date.now();
  ws.room = null;
  ws.sym = null;
  
  // Always update bothDisconnectedAt when both are disconnected
  if (!room.players.X && !room.players.O) {
    room.bothDisconnectedAt = Date.now(); // This matches the design's "ALWAYS update" statement
  }
  
  broadcast(room);
}
```

This is actually already correct in the design Section 3, but should be explicitly mentioned in Section 2.3 reconnect handler.

---

**MEDIUM-2: localStorage write happens before server acknowledges room creation**

**Location**: Section 5, useOnlineGame hook

**Problem**: The hook writes localStorage immediately when receiving the first `state` message:
```javascript
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
```

If the network connection drops immediately after receiving the state message but before the broadcast completes, the client has a session stored but the server might not have the room fully initialized. However, this is actually fine because the server's `broadcast()` only sends after the room is stored in the Map.

**Actually, this is NOT a problem** — verified that server stores room in Map before calling broadcast(). Downgrade to NIT for clarity.

---

**MEDIUM-3: Name normalization inconsistency in client vs server**

**Location**: Section 4 (NameModal) and Section 3 (validateName)

**Problem**: The client-side NameModal only trims the name:
```javascript
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
```

But the server's validateName lowercases it:
```javascript
return { valid: true, name: trimmed.toLowerCase() };
```

This means if a player enters "Alpa", the client stores "Alpa", but the server normalizes to "alpa". The client then tries to reconnect with "alpa" (from localStorage), which matches. However, when displaying the name in GameView, it will show "alpa" (lowercase) instead of "Alpa" (user's input).

**Fix**: Either normalize on the client too (send lowercase to server), OR store the original case in the server and normalize only for matching. Recommendation: Normalize on client for consistency:
```javascript
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
  onSubmit(trimmed.toLowerCase()); // Normalize on client
};
```

OR better: Store both original and normalized:
```javascript
playerNames: {
  X: { display: 'Alpa', normalized: 'alpa' },
  O: { display: 'Sarah', normalized: 'sarah' }
}
```

Then match using normalized but display using display. This is more complex but preserves user input.

**Simpler Fix**: Just normalize on client side before sending. Document that all names are stored lowercase.

---

**MEDIUM-4: Reconnection notification timeout not cleared on unmount**

**Location**: Section 5, useOnlineGame hook

**Problem**: The hook creates `reconnectTimeoutRef` and sets a timeout in `showReconnectNotice()`, and does clear it in the useEffect cleanup:
```javascript
return () => {
  intentionalClose.current = true;
  ws.close();
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
  }
};
```

This is actually correct. But the `showReconnectNotice` helper should also check if the timeout exists before creating a new one to avoid memory leaks:
```javascript
const showReconnectNotice = (message, duration = 3000) => {
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current); // Already in design
  }
  setReconnectNotice(message);
  reconnectTimeoutRef.current = setTimeout(() => {
    setReconnectNotice('');
    reconnectTimeoutRef.current = null; // Good: nulls out the ref
  }, duration);
};
```

Actually this is correct in the design. Mark as verified.

---

**MEDIUM-5: Missing error handling for invalid JSON in localStorage**

**Location**: Section 6, App.jsx useEffect (now moved to getInitialState per HIGH-5 fix)

**Problem**: The code tries to parse localStorage with a try-catch:
```javascript
try {
  const session = JSON.parse(sessionStr);
```

But doesn't validate that session has the expected fields. If the user manually edits localStorage or if an old version stored a different structure, the code might try to access undefined properties.

**Fix**: Add validation after parsing:
```javascript
try {
  const session = JSON.parse(sessionStr);
  if (!session.roomCode || !session.playerName) {
    localStorage.removeItem('ttt4_session');
    // Continue to check inviteCode...
    return;
  }
  // ... rest of logic
} catch (e) {
  localStorage.removeItem('ttt4_session');
}
```

---

**MEDIUM-6: Server doesn't validate message structure before accessing fields**

**Location**: Section 2, all message handlers

**Problem**: The handlers access `msg.name`, `msg.code`, `msg.index` without checking if they exist or have the correct type. For example:
```javascript
case 'create': {
  if (!msg.name) {
    return send(ws, { type: 'error', message: 'This game version requires a name. Please refresh the page.' });
  }
  const result = validateName(msg.name);
```

This is actually fine because `validateName` checks if it's a string. But `msg.code` in join and reconnect should be validated:
```javascript
case 'join': {
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
```

The `String(msg.code || '')` is defensive, so this is fine. The design is already safe.

---

### NIT Severity

**NIT-1: Typo in GameView status logic**

**Location**: Section 6, GameView.jsx

**Problem**: Minor: The status message "Waiting for <OpponentName>" should have consistent punctuation with the rest of the status messages. Currently:
- "alpa's turn" (lowercase possessive)
- "sarah's turn" (lowercase possessive)
- "alpa won!" (lowercase, exclamation)
- "sarah won!" (lowercase, exclamation)
- "Waiting for sarah" (capital W, lowercase name, no punctuation)

**Fix**: Either capitalize all names or keep them lowercase consistently. Recommendation: Keep all lowercase for consistency:
```javascript
status = opponentName === 'Friend' ? 'Waiting...' : `waiting for ${opponentName}`;
```

---

**NIT-2: Console log format inconsistency**

**Location**: Section 3, cleanup interval

**Problem**: The log calculates seconds but tries to access `rooms.get(code)` after deleting the room:
```javascript
for (const code of expiredRooms) {
  rooms.delete(code);
  console.log(`[Cleanup] Deleted room ${code} after ${Math.floor((now - rooms.get(code)?.bothDisconnectedAt || now) / 1000)}s of inactivity`);
}
```

`rooms.get(code)` returns undefined after deletion.

**Fix**: Calculate the time before deletion:
```javascript
for (const code of expiredRooms) {
  const room = rooms.get(code);
  const elapsedSeconds = Math.floor((now - (room?.bothDisconnectedAt || now)) / 1000);
  rooms.delete(code);
  console.log(`[Cleanup] Deleted room ${code} after ${elapsedSeconds}s of inactivity`);
}
```

---

**NIT-3: Missing documentation for playerSymbol field in localStorage**

**Location**: Section 6, App.jsx and Section 5, useOnlineGame

**Problem**: The design stores `playerSymbol` in localStorage:
```javascript
localStorage.setItem('ttt4_session', JSON.stringify({
  roomCode: m.code,
  playerName: m.playerNames[m.you],
  playerSymbol: m.you
}));
```

But `playerSymbol` is never read anywhere. The reconnect message only sends `code` and `name`:
```javascript
intent: { type: 'reconnect', code: session.roomCode, name: session.playerName }
```

**Fix**: Either remove `playerSymbol` from storage (simpler) or document why it's stored for future use. Current design doesn't need it because the server determines the symbol by matching the name.

---

**NIT-4: Mobile toast z-index might conflict with modals**

**Location**: Section 6, OnlineGame.jsx

**Problem**: The reconnection toast has `z-50`:
```jsx
<div className="fixed top-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-4 py-3 shadow-lg animate-fade-in z-50 max-w-[90vw]">
```

The NameModal has `z-50`:
```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
```

If a reconnection notice appears while the name modal is open (unlikely but possible if a player reconnects to a room that requires renaming due to conflict), they'll overlap.

**Fix**: Make modal `z-50` and toast `z-40`, or make toast `z-60`. Recommendation: Toast should be above modal since it's informational and temporary:
```jsx
<div className="... z-60 ...">
```

---

**NIT-5: Missing aria-live for reconnection notices**

**Location**: Section 6, OnlineGame.jsx

**Problem**: The reconnection toast doesn't have aria-live, so screen readers won't announce it.

**Fix**: Add aria-live="polite":
```jsx
<div className="fixed top-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-4 py-3 shadow-lg animate-fade-in z-50 max-w-[90vw]" aria-live="polite">
  <p className="text-sm font-medium">{reconnectNotice}</p>
</div>
```

---

**NIT-6: Inconsistent intent structure in FriendLobby**

**Location**: Section 6, FriendLobby.jsx

**Problem**: The design shows FriendLobby receiving `initialCode` prop and setting `pendingIntent` with `{ type: 'join', code }`, then calling `onStart({ ...pendingIntent, name })`. But when the URL invite conflicts with a session, App.jsx passes `intent: { type: 'join', code: inviteCode }` (no name). FriendLobby then needs to detect this and show the modal.

The design states "FriendLobby will prompt for name" but doesn't specify HOW it knows to auto-show the modal. Currently, `showNameModal` is only triggered by button clicks.

**Fix**: Add a useEffect in FriendLobby to auto-show the modal if there's an initialCode:
```javascript
useEffect(() => {
  if (initialCode && initialCode.length === 5) {
    setPendingIntent({ type: 'join', code: initialCode });
    setShowNameModal(true);
  }
}, [initialCode]);
```

Actually, this might be annoying if the user clicks Back and returns. Better: keep manual trigger only. The "FriendLobby will prompt for name" just means the modal appears when they click Join (which is the current flow). No change needed, just clarify the wording.

---

## Summary

### Critical Issues (HIGH): 5
1. Server leave() function rename and behavior conflicts
2. Missing reconnection field initialization in join handler
3. Reconnect error handling for cleared slots needs simplification
4. localStorage clear timing in leave() flow
5. App.jsx auto-reconnect should run before initial render

### Important Issues (MEDIUM): 5
1. bothDisconnectedAt clear logic (actually correct, needs confirmation)
2. localStorage write timing (actually fine, downgrade to verified)
3. Name normalization client vs server inconsistency
4. Reconnection timeout cleanup (actually correct, verified)
5. localStorage session field validation

### Minor Issues (NIT): 6
1. Status message capitalization consistency
2. Console log format in cleanup
3. Unused playerSymbol in localStorage
4. Modal/toast z-index conflict
5. Missing aria-live on reconnection notices
6. FriendLobby auto-modal behavior unclear

### Actual Count for Verdict
- HIGH: 5 findings
- MEDIUM: 2 findings (3 and 5; others verified as correct)
- NIT: 6 findings

## Verdict

**CHANGES_REQUESTED**

The design has 5 HIGH and 2 MEDIUM severity findings that must be resolved before implementation. The core reconnection logic is sound, but there are critical issues with:
- The server's existing leave() function behavior conflicting with reconnection
- Initialization timing and field presence checks
- localStorage lifecycle management
- Client-side name normalization consistency

Once these issues are addressed, the design will be ready for implementation.

---

## Testing Checklist for Implementation

After fixes are applied, the implementation should verify:

1. **Name collection flow**: Modal appears before create/join, validates correctly, rejects invalid names
2. **Personalized messages**: All status texts use actual player names
3. **Reconnection after refresh**: Page refresh reconnects automatically within 3 minutes
4. **Reconnection after network drop**: Temporary disconnection allows rejoin
5. **Reconnection notifications**: Both players see appropriate toast messages
6. **3-minute cleanup**: Rooms expire after both players are gone for 3+ minutes
7. **Explicit leave vs disconnect**: Leave clears name and resets game, disconnect preserves for reconnection
8. **URL invite with session conflict**: User sees friend lobby with pre-filled code
9. **Mobile UX**: Name modal works on iPhone with keyboard open, toast doesn't overlap board
10. **Edge cases**: Room expired, wrong name, both connected, explicit leave then reconnect
