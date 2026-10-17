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
  if (result) status = result.draw ? '> Draw' : result.winner === you ? '> You won' : `> ${foe} won`;
  else if (!opponentHere) status = '> Waiting...';
  else if (turn === you) status = '> Your turn';
  else status = mode === 'bot' ? '> Robot thinking...' : "> Friend's turn";

  const canPlay = !result && opponentHere && turn === you;

  const copyLink = () =>
    navigator.clipboard
      ?.writeText(`${location.origin}/?room=${code}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });

  return (
    <section className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-card rounded-lg p-4 border border-border">
        <span className="flex items-center gap-2 font-semibold text-sm">
          Playing as <Mark player={you} className="h-5 w-5" />
          <span className={you === 'X' ? 'text-primary' : 'text-secondary'}>{you}</span>
        </span>
        <Button variant="link" onClick={onLeave}>← Leave</Button>
      </div>

      {/* Room code for online mode */}
      {mode === 'online' && (
        <div className="mb-4 bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted">Room</span>
              <strong className="text-xl tracking-[0.3em] font-bold text-ink bg-bg-secondary px-3 py-1 rounded">{code}</strong>
            </div>
            <Button variant="link" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="my-6">
        <p className="text-lg font-bold font-mono" aria-live="polite">
          {status}
        </p>
      </div>

      {/* Board */}
      <div className="flex justify-center mb-6">
        <Board board={board} winCells={result?.cells} canPlay={canPlay} onPlay={play} />
      </div>

      {/* Rematch button */}
      {result && (
        <div className="flex justify-center">
          <Button onClick={rematch} disabled={rematchWaiting}>
            {mode === 'bot' ? 'Play Again' : rematchWaiting ? 'Waiting...' : 'Rematch'}
          </Button>
        </div>
      )}
      
      {/* Notice */}
      {notice && (
        <div role="status" className="mt-4 bg-card-hover border border-border rounded-lg p-3">
          <p className="text-xs text-muted font-mono">{notice}</p>
        </div>
      )}
    </section>
  );
}
