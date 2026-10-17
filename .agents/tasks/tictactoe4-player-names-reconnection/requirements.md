# Requirements: Player Names & Reconnection System

## Summary

Add player name collection and a reconnection system to the multiplayer Tic-Tac-Four game. Players must enter their name before creating or joining a room. All game messages will use actual player names instead of generic "You/Friend" labels. If a player disconnects (network drop, page refresh, browser crash), they can rejoin the same game within 3 minutes and resume from the current board state.

## Functional Requirements

### FR1: Player Name Input

Before a player creates or joins a room, prompt them for their name with a modal/dialog.

**WHEN** the user clicks "Create Room" or "Join Room" in FriendLobby  
**THEN** the system displays a name input modal with the prompt "What's your name?"

**WHEN** the player submits the name input  
**THEN** the system validates the name and either proceeds to create/join the room (valid) or shows an inline error message (invalid)

**WHEN** the name input modal is displayed  
**THEN** the modal includes a text input field, a submit button, and a way to cancel/go back

### FR2: Name Validation

Player names must meet specific constraints.

**WHEN** a player submits a name  
**THEN** the system rejects empty names and displays "Name cannot be empty"

**WHEN** a player submits a name longer than 15 characters  
**THEN** the system rejects it and displays "Name must be 15 characters or less"

**WHEN** a player submits a name containing only whitespace  
**THEN** the system rejects it and displays "Name cannot be empty"

**WHEN** a player submits a name with alphabetic characters and/or emojis (within 15 char limit)  
**THEN** the system accepts it and proceeds

### FR3: Name Storage and Transmission

Player names must be stored and sent to the server.

**WHEN** a player successfully enters a valid name  
**THEN** the system stores the name in component state in FriendLobby

**WHEN** the player creates a room  
**THEN** the WebSocket `create` message includes `{ type: 'create', name: <playerName> }`

**WHEN** the player joins a room  
**THEN** the WebSocket `join` message includes `{ type: 'join', code: <roomCode>, name: <playerName> }`

**WHEN** the server receives a `create` or `join` message  
**THEN** the server stores the player's name in the room object associated with their symbol (X or O)

### FR4: Personalized Game Messages

All game status messages must use actual player names instead of generic pronouns.

**WHEN** the game state is broadcast to a player  
**THEN** the server sends the player's own name and the opponent's name in the state message

**WHEN** it is the player's turn  
**THEN** GameView displays "<PlayerName>'s turn" (e.g., "Alpa's turn")

**WHEN** it is the opponent's turn  
**THEN** GameView displays "<OpponentName>'s turn" (e.g., "Friend's turn" becomes "Sarah's turn")

**WHEN** the player wins  
**THEN** GameView displays "<PlayerName> won!" (e.g., "Alpa won!")

**WHEN** the opponent wins  
**THEN** GameView displays "<OpponentName> won!" (e.g., "Sarah won!")

**WHEN** the opponent has not joined yet  
**THEN** GameView displays "Waiting for <OpponentName>" or "Waiting..." (if opponent name unknown)

**WHEN** the game ends in a draw  
**THEN** GameView displays "Draw!" (unchanged)

### FR5: Server-Side Game Persistence

The server must persist game state in memory to support reconnections.

**WHEN** a player creates or joins a room  
**THEN** the server stores in the room object: `code`, `board`, `turn`, `starter`, `result`, `rematch`, `players` (X and O with socket refs), `playerNames` ({ X: name, O: name }), `lastActivity` (timestamp)

**WHEN** any player action occurs (join, move, rematch)  
**THEN** the server updates `lastActivity` to the current timestamp

**WHEN** a player disconnects  
**THEN** the server sets their socket reference to `null` but retains the room and player name for 3 minutes

**WHEN** both players are disconnected and 3 minutes have elapsed since `lastActivity`  
**THEN** the server deletes the room from memory

### FR6: Client-Side Reconnection Tracking

The client must track active games in localStorage to enable auto-reconnect.

**WHEN** a player successfully joins or creates a room and receives the first `state` message  
**THEN** the client stores `{ roomCode, playerName, playerSymbol }` in localStorage under key `ttt4_session`

**WHEN** a player leaves a game via the Leave button  
**THEN** the client clears the `ttt4_session` from localStorage

**WHEN** a game ends and the player navigates away  
**THEN** the client clears the `ttt4_session` from localStorage

**WHEN** both players disconnect  
**THEN** the session remains in localStorage until the player explicitly leaves or the room expires

### FR7: Auto-Reconnection on Load

When the app loads, attempt to reconnect if a session exists.

**WHEN** App.jsx mounts and `ttt4_session` exists in localStorage  
**THEN** the app reads the stored `{ roomCode, playerName }` and sets the initial screen to `onlineGame` with intent `{ type: 'reconnect', code: roomCode, name: playerName }`

**WHEN** App.jsx mounts and no `ttt4_session` exists  
**THEN** the app loads the home screen (current behavior)

**WHEN** App.jsx mounts and a URL invite code exists (`?room=XXXXX`) AND `ttt4_session` exists  
**THEN** the app prioritizes reconnection (ignores the URL invite code)

### FR8: Server-Side Reconnection Handling

The server must handle reconnection attempts and restore the player's role.

**WHEN** the server receives a `reconnect` message with `{ type: 'reconnect', code, name }`  
**THEN** the server looks up the room by `code`

**WHEN** the room exists and the player's name matches one of the stored player names (X or O)  
**THEN** the server assigns the matching symbol to the reconnecting WebSocket, updates the socket reference in `room.players`, updates `lastActivity`, and broadcasts the current game state

**WHEN** the room does not exist  
**THEN** the server responds with `{ type: 'error', message: 'Room expired or not found. Create or join a new room.' }`

**WHEN** the room exists but the player's name does not match either stored player  
**THEN** the server responds with `{ type: 'error', message: 'You were not in this game.' }`

**WHEN** the room is full (both X and O sockets are already connected)  
**THEN** the server responds with `{ type: 'error', message: 'Both players are already connected.' }`

### FR9: Reconnection Notifications

Players must be notified when reconnections occur.

**WHEN** a player successfully reconnects  
**THEN** the server sends a `{ type: 'player_reconnected', playerName: <name> }` message to the opponent (if connected)

**WHEN** the reconnecting player receives the state after reconnecting  
**THEN** the client displays a temporary notification "You're back in the game!" with a fade-in effect (2-3 second duration)

**WHEN** the opponent receives a `player_reconnected` message  
**THEN** the client displays a temporary notification "<PlayerName> reconnected" with a fade-in effect (2-3 second duration)

**WHEN** a reconnection notification is displayed  
**THEN** it appears as a toast/banner at the top or bottom of the game view and auto-dismisses after 2-3 seconds

### FR10: Reconnection Edge Cases

Handle scenarios where reconnection fails or behaves unexpectedly.

**WHEN** a player attempts to reconnect but the 3-minute timeout has passed  
**THEN** the client clears `ttt4_session` from localStorage and shows the FriendLobby screen with an error notice

**WHEN** a player manually navigates to the app (not a refresh) while a session exists  
**THEN** the app attempts auto-reconnection (same as page refresh)

**WHEN** a player reconnects and the game has already ended  
**THEN** the client displays the final game state with the winner/draw message and rematch options

**WHEN** the opponent is still disconnected when a player reconnects  
**THEN** the game state shows `opponentHere: false` and displays "Waiting for <OpponentName>" until the opponent reconnects

## Non-Functional Requirements

### NFR1: Mobile UX (iPhone Focus)

The name input modal and reconnection notifications must be optimized for mobile devices, especially iPhone.

**WHEN** the name input modal is displayed on iPhone  
**THEN** the modal is centered, has adequate padding, the input field has a large touch target (min 44×44 pt), and the keyboard does not obscure the submit button

**WHEN** a reconnection notification appears on mobile  
**THEN** the notification does not overlap with game controls, is readable (min 14px font size), and does not cause layout shifts

### NFR2: Performance

Reconnection must be fast and seamless.

**WHEN** a player refreshes the page  
**THEN** the auto-reconnect attempt begins within 500ms

**WHEN** the server checks for expired rooms  
**THEN** it runs a background cleanup every 60 seconds to remove rooms where `lastActivity` is older than 3 minutes and both players are disconnected

## Acceptance Criteria

### AC1: Name Input Flow

1. WHEN I click "Create Room", THEN I see a name input modal
2. WHEN I submit an empty name, THEN I see "Name cannot be empty"
3. WHEN I submit a 20-character name, THEN I see "Name must be 15 characters or less"
4. WHEN I submit "Alpa", THEN the modal closes and the room is created
5. WHEN I join a room with the name "Sarah", THEN my name is sent to the server

### AC2: Personalized Messages

1. WHEN I am player "Alpa" and it is my turn, THEN I see "Alpa's turn"
2. WHEN my opponent "Sarah" is playing, THEN I see "Sarah's turn"
3. WHEN I win, THEN I see "Alpa won!"
4. WHEN Sarah wins, THEN I see "Sarah won!"
5. WHEN Sarah has not joined yet, THEN I see "Waiting for Sarah" or "Waiting..."

### AC3: Reconnection After Disconnect

1. WHEN I create a room and the page refreshes, THEN I automatically rejoin the same room
2. WHEN I disconnect and reconnect within 3 minutes, THEN I see the current board state (not move history)
3. WHEN I disconnect and my opponent makes moves, THEN on reconnect I see the updated board
4. WHEN I reconnect, THEN I see "You're back in the game!" for 2-3 seconds
5. WHEN my opponent reconnects, THEN I see "Sarah reconnected" for 2-3 seconds

### AC4: Reconnection Failures

1. WHEN I attempt to reconnect after 3 minutes, THEN I see "Room expired or not found" and return to FriendLobby
2. WHEN I attempt to reconnect with a mismatched name, THEN I see "You were not in this game"
3. WHEN I attempt to reconnect and both players are already connected, THEN I see "Both players are already connected"

### AC5: Session Cleanup

1. WHEN I click "Leave", THEN localStorage is cleared and I return to Home
2. WHEN a game ends and I navigate away, THEN localStorage is cleared
3. WHEN both players disconnect for 3+ minutes, THEN the server deletes the room

### AC6: Mobile UX

1. WHEN I open the name input modal on iPhone, THEN the input field is tappable and the keyboard does not obscure the button
2. WHEN a reconnection notification appears on iPhone, THEN it is readable and does not overlap the board
3. WHEN I play on iPhone after reconnecting, THEN the touch targets remain responsive (no layout shift)

## Out of Scope

- Displaying move history (user explicitly chose Option A: current state only)
- Persistent storage in a database (user confirmed in-memory only)
- Custom reconnection timeout configuration (locked to 3 minutes)
- Player avatars or profile pictures
- Multiple reconnection notifications stacking (single notification at a time)
- Name uniqueness validation (two players can have the same name)
- Name editing after submission (requires leaving and rejoining)
- Notifying the opponent when a player disconnects (only when they reconnect)

## Assumptions

1. The WebSocket connection uses the existing `/ws` endpoint and message protocol structure.
2. The server runs a single Node.js instance (no clustering), so in-memory persistence is sufficient.
3. Players will not deliberately exploit reconnection (e.g., opening multiple tabs to bypass "room full" logic).
4. The 3-minute timeout starts from the last activity (join, move, rematch), not from disconnection time.
5. If a room code collision occurs during reconnection (extremely unlikely with 5-character codes), the reconnection fails gracefully.
6. The game logic in `src/shared/game.js` does not need modification (board, win detection, etc. remain unchanged).
7. Tailwind CSS classes are available for styling modals and notifications without adding new dependencies.
8. The existing `notice` prop in GameView can be reused or extended for reconnection notifications.
