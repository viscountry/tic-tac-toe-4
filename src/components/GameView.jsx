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
    status = 'Waiting for friend...';
  } else if (turn === you) {
    status = 'Your turn';
  } else {
    status = mode === 'bot' ? 'Robot thinking...' : "Friend's turn";
  }

  const canPlay = !result && opponentHere && turn === you;

  const copyLink = () =>
    navigator.clipboard
      ?.writeText(`${location.origin}/?room=${code}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });

  return (
    <section className="max-w-md mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Playing as</span>
          <Mark player={you} className="h-5 w-5" />
        </div>
        <Button variant="link" onClick={onLeave}>Leave</Button>
      </div>

      {mode === 'online' && (
        <div className="mb-6 bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted mb-1">Room Code</div>
              <div className="text-2xl font-bold tracking-widest">{code}</div>
            </div>
            <Button variant="link" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</Button>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <p className="text-xl font-semibold" aria-live="polite">{status}</p>
      </div>

      <div className="flex justify-center mb-6">
        <Board board={board} winCells={result?.cells} canPlay={canPlay} onPlay={play} />
      </div>

      {result && (
        <Button onClick={rematch} disabled={rematchWaiting}>
          {mode === 'bot' ? 'Play Again' : rematchWaiting ? 'Waiting...' : 'Rematch'}
        </Button>
      )}
      
      {notice && (
        <div className="mt-4 bg-card border border-border rounded-lg p-3">
          <p className="text-sm text-muted">{notice}</p>
        </div>
      )}
    </section>
  );
}
