# Tic-Tac-Four

A two-player game on a **7×6 board**. Players (X and O) take turns placing a mark in any empty cell. The first to line up **four marks in a row**, horizontally, vertically or diagonally, wins. If the board fills up, it's a draw.

You can play **against a robot** (Easy or Hard) or **against a friend online** by sharing a 5-character room code.

## Tech stack

| Part | Tool | Why |
| --- | --- | --- |
| UI | React 18 + Vite | Component-based frontend, fast dev server |
| Styling | Tailwind CSS v4 | Utility classes; theme colours live in `src/index.css` |
| Realtime | WebSockets (`ws`) | Both players see moves instantly |
| Server | Node + Express | Serves the built UI and hosts the game rooms |
| Storage | **None** (in memory) | Rooms live in a JS `Map`; no database |
| Hosting | Render (one Web Service) | Node server serves the UI and the WebSocket |

## How it works

```
Browser A ──┐                               ┌── Browser B
            │  WebSocket  /ws               │
            └────────►  Node server  ◄──────┘
                        rooms = Map(code → room)
```

1. A user opens the site and picks **Play with a friend** or **Play the robot**.
2. **Robot:** the whole game runs in the browser (`useBotGame`). The server is not involved.
3. **Friend:** the user either **creates a room** (gets a code, becomes X) or **joins with a code / invite link** (becomes O).
4. The server holds the board and whose turn it is, checks every move, and sends the new state to both players.
5. After a game, both players click **Rematch** and the first move alternates.
6. If a player leaves, the room resets and stays open so someone can re-join with the same code. When both leave, the room is deleted.

### WebSocket messages

| Direction | Message | Meaning |
| --- | --- | --- |
| client → server | `{type:'create'}` | Make a room, become X |
| client → server | `{type:'join', code}` | Join a room, take the free seat |
| client → server | `{type:'move', index}` | Place a mark at cell `0..41` |
| client → server | `{type:'rematch'}` | Vote for a rematch |
| server → client | `{type:'state', code, you, board, turn, result, opponentHere, rematchVotes}` | Full snapshot, sent to both players after every change |
| server → client | `{type:'error', message}` | e.g. unknown code, room full |
| server → client | `{type:'opponent_left'}` | The other player disconnected |

The server never trusts the browser: it rejects moves that are out of turn, on a taken cell, or after the game is over.

### The robot

- **Easy:** takes a winning move if one exists, blocks the opponent's winning move, otherwise plays randomly.
- **Hard:** same win/block checks, then a 3-move-deep minimax search with alpha-beta pruning. Positions are scored by counting open 4-cell lines for each side.

## Folder structure

```
tic-tac-four/
├── index.html              Vite entry point (only a mount point, no UI here)
├── vite.config.js          React + Tailwind plugins, dev proxy for /ws
├── package.json            Scripts and dependencies (one package for both server and UI)
├── render.yaml             Render deployment settings
├── server/
│   └── index.js            Express + WebSocket server, room logic
└── src/
    ├── main.jsx            React entry
    ├── App.jsx             Decides which screen to show
    ├── index.css           Tailwind import + colour theme + font
    ├── shared/game.js      Game rules + robot AI (used by BOTH server and UI)
    ├── hooks/
    │   ├── useBotGame.js       Game state for robot mode
    │   └── useOnlineGame.js    WebSocket connection for online mode
    ├── screens/
    │   ├── Home.jsx            Choose friend or robot
    │   ├── BotSetup.jsx        Difficulty and side
    │   ├── FriendLobby.jsx     Create room / enter code
    │   ├── BotGame.jsx         Robot game (hook + GameView)
    │   └── OnlineGame.jsx      Online game (hook + GameView)
    └── components/
        ├── GameView.jsx        Status text, room code, board, rematch button
        ├── Board.jsx           The 7×6 grid
        ├── Mark.jsx            X and O drawings
        ├── Button.jsx          Shared button styles
        └── Segmented.jsx       Option picker (Easy/Hard, X/O)
```

`src/shared/game.js` is the single source of truth for the rules. The server uses it to validate moves and the browser uses it for the robot, so the two can never disagree about who won.

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Open http://localhost:5173. To test multiplayer, open it in two browser tabs: create a room in one, join with the code in the other.

`npm run dev` starts two things: the Node server on port 3000 and the Vite dev server on 5173, which forwards `/ws` to the Node server.

To test the production build:

```bash
npm run build   # creates dist/
npm start       # serves dist/ and WebSocket on http://localhost:3000
```

## Deploy on Render

### Prerequisites
- A GitHub account
- Your code pushed to a GitHub repository

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **New → Web Service**
   - Connect your GitHub repository
   - Render will auto-detect settings from `render.yaml`, or manually enter:
     - **Build Command:** `npm install --include=dev && npm run build`
     - **Start Command:** `npm start`
     - **Environment:** Node
   - Click **Create Web Service**

3. **Wait for deployment** (first build takes 2-3 minutes)

4. **Open your app** using the URL Render provides (e.g., `https://your-app.onrender.com`)

### Alternative: Blueprint Deployment
If you prefer using Render Blueprints:
1. In Render: **New → Blueprint**
2. Select your repository
3. Render reads `render.yaml` automatically
4. Click **Apply**

**Note:** `--include=dev` is needed because Render skips dev dependencies in production, and Vite and Tailwind are only needed at build time.

### Testing Your Deployment
- Visit the URL Render gives you
- Create a room and share the code with a friend
- Test both robot mode and online multiplayer

---

## 📋 Project Setup Changelog

### October 1, 2026 - Dark Mode Marvel UI + Mobile Optimization ✨

**Major UI/UX Overhaul:**
- 🌙 **Dark Mode Theme** - Marvel-inspired color scheme with gradients
- 📱 **Mobile-First Responsive Design** - Optimized for all screen sizes
- ✨ **Animated Background** - Floating gradient orbs for depth
- 🎨 **Enhanced Visual Hierarchy** - Better spacing, shadows, and borders
- 🎯 **Improved Board Design** - Larger tap targets, glowing win animations
- 💎 **Premium Components** - Cards with gradients, hover effects, and shadows
- 🎭 **Emoji Status Messages** - More engaging game feedback
- 🔥 **Smooth Animations** - Scale, glow, and transition effects
- 🎮 **Better Game Controls** - Larger buttons, clearer actions

**Color Palette:**
- Primary Red: `#ef4444` (X marks, win states, CTAs)
- Secondary Blue: `#3b82f6` (O marks, links)
- Accent Purple: `#8b5cf6` (decorative elements)
- Background: Dark gradient `#0f172a` → `#1e293b`
- Cards: `#1e293b` with border `#334155`

**Component Updates:**
- ✏️ `src/index.css` - Dark theme, animations, custom scrollbar
- ✏️ `src/components/Button.jsx` - Gradient effects, shine animation
- ✏️ `src/components/Board.jsx` - Responsive sizing, win glow effects
- ✏️ `src/components/Mark.jsx` - Thicker strokes, drop shadows
- ✏️ `src/components/GameView.jsx` - Card layouts, emoji status
- ✏️ `src/components/Segmented.jsx` - Gradient active state
- ✏️ `src/screens/Home.jsx` - Hero section with gradient title
- ✏️ `src/screens/BotSetup.jsx` - Card-based settings
- ✏️ `src/screens/FriendLobby.jsx` - Visual room creation/joining
- ✏️ `src/App.jsx` - Adjusted container width and padding

### October 1, 2026 - Initial Setup for Render Deployment

**Files Created:**
- ✅ `vite.config.js` - Vite configuration with React and Tailwind plugins
- ✅ `index.html` - HTML entry point with Inter font
- ✅ `render.yaml` - Render deployment configuration
- ✅ `.gitignore` - Git ignore rules for node_modules, dist, etc.
- ✅ `src/main.jsx` - React app entry point
- ✅ `src/index.css` - Tailwind imports and theme colors
- ✅ `src/App.jsx` - Main app router component
- ✅ `src/shared/game.js` - Game rules and AI logic
- ✅ `src/hooks/useBotGame.js` - Robot game state hook
- ✅ `src/hooks/useOnlineGame.js` - WebSocket connection hook
- ✅ `src/screens/Home.jsx` - Home screen
- ✅ `src/screens/BotSetup.jsx` - Robot difficulty selection
- ✅ `src/screens/BotGame.jsx` - Robot game screen
- ✅ `src/screens/FriendLobby.jsx` - Create/join room screen
- ✅ `src/screens/OnlineGame.jsx` - Online multiplayer screen
- ✅ `src/components/GameView.jsx` - Game board and status display
- ✅ `src/components/Board.jsx` - 7×6 game board grid
- ✅ `src/components/Mark.jsx` - X and O SVG components
- ✅ `src/components/Button.jsx` - Reusable button component
- ✅ `src/components/Segmented.jsx` - Option picker component
- ✅ `server/index.js` - Express + WebSocket server

**Structure Reorganization:**
- 📁 Moved all React components to `src/` folder
- 📁 Organized components into `src/components/`, `src/screens/`, `src/hooks/`
- 📁 Moved server code to `server/` folder
- 📁 Created proper folder structure matching README documentation

**Changes Made:**
- ✏️ Updated all import paths to reflect new folder structure
- ✏️ Server now correctly imports from `../src/shared/game.js`
- ✏️ All components use proper relative imports

**Ready for Deployment:**
- ✅ All files are properly organized
- ✅ Configuration files are in place
- ✅ Project follows best practices for Render deployment
- ✅ Both development and production builds are configured

---

## Known limits

- **No persistence:** restarting or redeploying the server deletes all rooms and games.
- **One server instance only:** rooms are in that process's memory, so scaling to several instances would split players into different servers. Adding Redis would fix that later.
- **Free Render tier sleeps** after inactivity, so the first visit can take about 30 seconds.
- No reconnect: if a player's connection drops, they return to the lobby and rejoin with the code.

## Where to change things

| I want to… | Edit |
| --- | --- |
| Change the board size or win length | `ROWS`, `COLS`, `WIN` in `src/shared/game.js` (the grid uses `grid-cols-7` in `Board.jsx`, so update it too) |
| Make the robot smarter | The search depth in `bestMove` (`src/shared/game.js`). Higher is stronger but slower |
| Add gravity (Connect Four style) | Restrict allowed moves in `server/index.js` (`move`), `useBotGame.js`, and the robot's move list |
| Change colours or font | `@theme` block in `src/index.css` |
| Change wording | The screen files in `src/screens/` and `GameView.jsx` |
| Add accounts, leaderboards | Needs a database, which is a separate step |
