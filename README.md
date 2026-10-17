# Tic-Tac-Four

Think Tic-Tac-Toe meets Connect Four. It's played on a 7×6 grid where you can place your mark anywhere (not just dropping from the top). Get four in a row horizontally, vertically, or diagonally to win.

Play against an AI opponent with two difficulty levels, or challenge a friend online by sharing a simple room code.

## What's it built with?

- **React 18** with Vite for the frontend
- **Tailwind CSS v4** for styling (dark mode, gradients, all that good stuff)
- **WebSockets** for real-time multiplayer
- **Node.js + Express** backend
- **No database** - rooms are stored in memory (simple but means they reset on server restart)
- Designed to deploy on **Render's free tier**

## How multiplayer works

When you pick "Play with a friend":
- **Enter your name** (up to 15 characters, emojis allowed!)
- Creating a room gives you a 5-letter code to share
- Your friend joins using that code or the invite link
- Both browsers connect to the server via WebSocket
- The server validates moves and broadcasts the board state to both players
- **Reconnection:** If you disconnect (refresh page, network hiccup), you can rejoin the same room within 3 minutes and your game continues right where it left off
- Rooms auto-delete 3 minutes after both players disconnect
- See personalized messages like "Alpa's turn" and "Alex won!" instead of generic "Your turn"

Playing against the robot runs entirely in your browser - no server needed.

### How the server validates everything

The server doesn't trust the client. It checks:
- Is it your turn?
- Is that cell empty?
- Is the game still going?

If any check fails, your move gets rejected. This prevents cheating even if someone modifies the JavaScript in their browser.

### Robot difficulty

**Easy mode** will take wins when available and block your wins, but otherwise plays randomly. Good for casual games.

**Hard mode** uses minimax with alpha-beta pruning (3 moves deep). It evaluates positions by counting potential winning lines. It's tough to beat but not impossible.

## Project structure

```
tic-tac-four/
├── server/
│   └── index.js          Express server + WebSocket rooms
└── src/
    ├── shared/game.js    Game rules + AI (shared by server & client)
    ├── hooks/            React hooks for game state
    ├── screens/          Full-page components
    └── components/       Reusable UI pieces
```

The game logic in `src/shared/game.js` is used by both the server (to validate moves) and the client (to run the AI). This ensures the rules are consistent everywhere.

## Running it locally

You'll need Node 20 or newer.

```bash
npm install
npm run dev
```

This starts the backend on port 3000 and Vite dev server on 5173. Open http://localhost:5173 in your browser.

To test multiplayer, open two tabs and create a room in one, then join with the code in the other.

To test the production build:
```bash
npm run build
npm start
```
Then visit http://localhost:3000.

## Deploying to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and create a new Web Service
3. Connect your GitHub repo
4. Render should auto-detect the settings from `render.yaml`
5. If not, use these:
   - Build: `npm install --include=dev && npm run build`
   - Start: `npm start`
6. Deploy and wait 2-3 minutes

The `--include=dev` flag is important because Vite and Tailwind are needed at build time but are listed as dev dependencies.

**Free tier heads up:** Render's free tier spins down after 15 minutes of inactivity. The first visit after that takes about 30 seconds to wake up.



## Limitations

- Rooms are stored in memory, so restarting the server wipes everything
- Can only run on one server instance (rooms don't sync across multiple servers)
- Reconnection only works within 3 minutes of disconnect
- Free Render tier goes to sleep after inactivity

## Want to customize it?

- **Board size/win condition:** Change `ROWS`, `COLS`, `WIN` in `src/shared/game.js` (also update `grid-cols-7` in `Board.jsx`)
- **AI difficulty:** Adjust the search depth in `bestMove()` - higher = smarter but slower
- **Colors/theme:** Edit the `@theme` block in `src/index.css`
- **Text/wording:** Check the screen files in `src/screens/`
- **Add gravity (Connect Four style):** You'll need to restrict move validation in `server/index.js` and `useBotGame.js`
