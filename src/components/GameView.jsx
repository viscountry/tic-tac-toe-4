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
  if (result) status = result.draw ? '🤝 Draw! Board is full.' : result.winner === you ? '🎉 You won! Four in a row!' : `${foe === 'The robot' ? '🤖' : '😔'} ${foe} won this round.`;
  else if (!opponentHere) status = '⏳ Waiting for your friend...';
  else if (turn === you) status = '🎯 Your turn!';
  else status = mode === 'bot' ? '🤔 Robot is thinking...' : "⏱️ Friend's turn...";

  const canPlay = !result && opponentHere && turn === you;

  const copyLink = () =>
    navigator.clipboard
      ?.writeText(`${location.origin}/?room=${code}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });

  return (
    <section className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-card rounded-xl p-4 border border-border">
        <span className="flex items-center gap-2 font-bold text-sm sm:text-base">
          You are <Mark player={you} className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className={you === 'X' ? 'text-primary' : 'text-secondary'}>{you}</span>
        </span>
        <Button variant="link" onClick={onLeave}>← Leave</Button>
      </div>

      {/* Room code for online mode */}
      {mode === 'online' && (
        <div className="mb-4 bg-gradient-to-r from-card to-card-hover rounded-xl p-4 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Room</span>
              <strong className="text-2xl sm:text-3xl tracking-[0.3em] font-black text-ink bg-bg-tertiary px-4 py-1 rounded-lg">{code}</strong>
            </div>
            <Button variant="link" onClick={copyLink}>
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </Button>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="my-6 text-center">
        <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight min-h-[2rem]" aria-live="polite">
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
            {mode === 'bot' ? '🔄 Play Again' : rematchWaiting ? '⏳ Waiting for friend...' : '🔄 Rematch'}
          </Button>
        </div>
      )}
      
      {/* Notice */}
      {notice && (
        <div role="status" className="mt-4 text-center bg-card-hover border border-border rounded-xl p-4">
          <p className="text-muted text-sm">{notice}</p>
        </div>
      )}
    </section>
  );
}
