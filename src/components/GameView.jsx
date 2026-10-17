import { useState } from 'react';
import Board from './Board.jsx';
import Button from './Button.jsx';
import Mark from './Mark.jsx';

export default function GameView({ game, mode, notice, onLeave }) {
  const { board, turn, you, result, opponentHere, code, play, rematch, rematchWaiting } = game;
  const [copied, setCopied] = useState(false);
  const foe = mode === 'bot' ? 'Robot' : 'Friend';

  let status;
  if (result) {
    status = result.draw ? 'Draw!' : result.winner === you ? 'You won!' : `${foe} won`;
  } else if (!opponentHere) {
    status = 'Waiting...';
  } else if (turn === you) {
    status = 'Your turn';
  } else {
    status = mode === 'bot' ? 'Thinking...' : "Friend's turn";
  }

  const canPlay = !result && opponentHere && turn === you;

  const copyLink = () =>
    navigator.clipboard
      ?.writeText(`${location.origin}/?room=${code}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });

  return (
    <section className="min-h-screen flex flex-col px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted">Playing as</span>
          <Mark player={you} className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <Button variant="link" onClick={onLeave}>Leave</Button>
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
