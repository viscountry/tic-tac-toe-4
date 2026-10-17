import { useEffect, useRef, useState } from 'react';
import * as TTF from '../shared/game.js';

export function useBotGame(level, userSide) {
  const [board, setBoard] = useState(TTF.newBoard());
  const [turn, setTurn] = useState('X');
  const [result, setResult] = useState(null);
  const botRef = useRef(userSide === 'X' ? 'O' : 'X');

  const play = (index) => {
    if (result || board[index] || turn !== userSide) return;
    const next = [...board];
    next[index] = turn;
    setBoard(next);

    const w = TTF.findWin(next);
    if (w) { setResult({ winner: w.player, cells: w.cells }); return; }
    if (TTF.isFull(next)) { setResult({ draw: true }); return; }
    setTurn(TTF.other(turn));
  };

  const rematch = () => {
    setBoard(TTF.newBoard());
    setTurn('X');
    setResult(null);
  };

  // Bot move
  useEffect(() => {
    if (result || turn !== botRef.current) return;
    const timer = setTimeout(() => {
      const i = TTF.bestMove(board, botRef.current, level);
      const next = [...board];
      next[i] = botRef.current;
      setBoard(next);

      const w = TTF.findWin(next);
      if (w) { setResult({ winner: w.player, cells: w.cells }); return; }
      if (TTF.isFull(next)) { setResult({ draw: true }); return; }
      setTurn(TTF.other(turn));
    }, 500);
    return () => clearTimeout(timer);
  }, [turn, board, result, level]);

  return { board, turn, you: userSide, result, opponentHere: true, play, rematch };
}
