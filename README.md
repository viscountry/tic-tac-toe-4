# Tic-Tac-Four

Tic-Tac-Toe but on a 7×6 board. You need four in a row to win (horizontal, vertical, or diagonal). You can place your mark on any empty cell.

Play against a robot or play online with a friend using room codes.

## Stack

- React 18 + Vite
- Tailwind CSS v4
- Node.js / Express
- WebSockets (ws)
- No database, rooms live in memory
- Hosted on Render

## How to play online

1. Click "Play with Friend"
2. Enter your name
3. Create a room or join one with a code
4. Share the invite link to your friend — they'll enter their name and join automatically
5. If you get disconnected, just come back within 3 minutes and you'll reconnect to the same game

Both players see each other's names during the game ("Alpa's turn", "Alex won!" etc).

## Robot

Two modes:
- **Easy** — plays random but will take a win or block yours if it can
- **Hard** — looks 3 moves ahead using minimax, pretty hard to beat

Robot games run entirely in your browser, no server involved.

## Run locally

```
npm install
npm run dev
```

Dev server on http://localhost:5173, backend on port 3000.

For production:
```
npm run build
npm start
```

## Deploy

Push to GitHub, connect to Render. It picks up `render.yaml` automatically.

Build command: `npm install --include=dev && npm run build`
Start command: `npm start`

Render free tier sleeps after 15 min of no traffic. First load after that takes ~30 sec.

## Project layout

```
server/index.js        — Express + WebSocket server
src/shared/game.js     — game rules + robot AI (used by both server and client)
src/hooks/             — React hooks (online game, bot game)
src/screens/           — pages (home, lobby, bot setup)
src/components/        — board, buttons, marks
```

## Made by Onve
