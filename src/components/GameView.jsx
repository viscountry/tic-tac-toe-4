import { useState } from 'react';
import Board from './Board.jsx';
import Button from './Button.jsx';
import Mark from './Mark.jsx';

// Presentational: works the same for robot and online games.
// `game` = { board, turn, you, result, opponentHere, code, play(i), rematch(), rematchWaiting }
export default function GameView({ game, mode, notice, onLeave }) {
  const { board, turn, you, result, opponentHere, code, play, rematch, rematchWaiting } = game;
  const [copied, setCopied] = useState(false);
  const foe = mode === 'bot' ? 'The robot' : 'Your friend';

  let status;
  if (result) status = result.draw ? 'Draw. The board is full.' : result.winner === you ? 'You got four in a row!' : `${foe} got four in a row.`;
  else if (!opponentHere) status = 'Waiting for your friend to join…';
  else if (turn === you) status = 'Your turn';
  else status = mode === 'bot' ? 'The robot is thinking…' : "Your friend's turn";

  const canPlay = !result && opponentHere && turn === you;

  const copyLink = () =>
    navigator.clipboard
      ?.writeText(`${location.origin}/?room=${code}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });

  return (
    <section>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold">You are <Mark player={you} className="h-[22px] w-[22px]" /></span>
        <Button variant="link" onClick={onLeave}>Leave game</Button>
      </div>

      {mode === 'online' && (
        <div className="mt-1 flex items-center justify-between gap-3 text-muted">
          <span>Room code <strong className="mx-1.5 text-xl tracking-[0.2em] text-ink">{code}</strong></span>
          <Button variant="link" onClick={copyLink}>{copied ? 'Copied!' : 'Copy invite link'}</Button>
        </div>
      )}

      <p className="my-3.5 min-h-9 text-2xl font-extrabold tracking-tight" aria-live="polite">{status}</p>
      <Board board={board} winCells={result?.cells} canPlay={canPlay} onPlay={play} />

      {result && (
        <Button onClick={rematch} disabled={rematchWaiting}>
          {mode === 'bot' ? 'Play again' : rematchWaiting ? 'Waiting for your friend…' : 'Rematch'}
        </Button>
      )}
      {notice && <p role="status" className="mt-4 text-muted">{notice}</p>}
    </section>
  );
}
