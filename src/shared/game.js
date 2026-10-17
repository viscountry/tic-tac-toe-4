// Shared game rules + robot. Imported by the React app and by the server.
const ROWS = 6, COLS = 7, WIN = 4;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

// Every possible line of 4 cells, as arrays of board indices.
const WINDOWS = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dr, dc] of DIRS) {
  const er = r + dr * (WIN - 1), ec = c + dc * (WIN - 1);
  if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
  WINDOWS.push(Array.from({ length: WIN }, (_, k) => (r + dr * k) * COLS + c + dc * k));
}

const newBoard = () => Array(ROWS * COLS).fill(null);
const other = (p) => (p === 'X' ? 'O' : 'X');
const isFull = (b) => b.every(Boolean);

function findWin(b) {
  for (const w of WINDOWS) {
    const p = b[w[0]];
    if (p && p === b[w[1]] && p === b[w[2]] && p === b[w[3]]) return { player: p, cells: w };
  }
  return null;
}

// Cells sorted centre-first: better pruning and a sensible default preference.
const dist = (i) => Math.abs(Math.floor(i / COLS) - 2.5) + Math.abs((i % COLS) - 3);
const ORDER = [...Array(ROWS * COLS).keys()].sort((a, b) => dist(a) - dist(b));

const WEIGHT = [0, 1, 10, 100, 100000];
function heuristic(b, me) {
  const opp = other(me);
  let s = 0;
  for (const w of WINDOWS) {
    let m = 0, o = 0;
    for (const i of w) { if (b[i] === me) m++; else if (b[i] === opp) o++; }
    if (m && o) continue;
    if (m) s += WEIGHT[m]; else if (o) s -= WEIGHT[o];
  }
  return s;
}

function search(b, depth, alpha, beta, turn, me) {
  const w = findWin(b);
  if (w) return (w.player === me ? 1 : -1) * (1e6 + depth);
  if (depth === 0) return heuristic(b, me);
  const maximizing = turn === me;
  let best = maximizing ? -Infinity : Infinity, any = false;
  for (const i of ORDER) {
    if (b[i]) continue;
    any = true;
    b[i] = turn;
    const v = search(b, depth - 1, alpha, beta, other(turn), me);
    b[i] = null;
    if (maximizing) { if (v > best) best = v; if (best > alpha) alpha = best; }
    else { if (v < best) best = v; if (best < beta) beta = best; }
    if (alpha >= beta) break;
  }
  return any ? best : 0;
}

// level: 'easy' (random, but takes wins and blocks) | 'hard' (3-ply alpha-beta search)
function bestMove(board, me, level) {
  const b = board.slice();
  const empties = ORDER.filter((i) => !b[i]);
  const winningFor = (p) => empties.find((i) => { b[i] = p; const w = findWin(b); b[i] = null; return !!w; });

  let m = winningFor(me);
  if (m !== undefined) return m;
  m = winningFor(other(me));
  if (m !== undefined) return m;
  if (level === 'easy') return empties[Math.floor(Math.random() * empties.length)];

  let bestV = -Infinity, picks = [];
  for (const i of empties) {
    b[i] = me;
    const v = search(b, 2, -Infinity, Infinity, other(me), me);
    b[i] = null;
    if (v > bestV) { bestV = v; picks = [i]; } else if (v === bestV) picks.push(i);
  }
  return picks[Math.floor(Math.random() * picks.length)];
}

export { ROWS, COLS, WIN, newBoard, other, isFull, findWin, bestMove };
