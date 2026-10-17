import { useState } from 'react';
import Board from './Board.jsx';
import Button from './Button.jsx';
import Mark from './Mark.jsx';

export default function GameView({ game, mode, notice, reconnectNotice, onLeave }) {
  const { board, turn, you, result, opponentHere, code, play, rematch, rematchWaiting, yourName, opponentName } = game;
  const [copied, setCopied] = useState(false);
  
  // Use player names or fallback to generic labels
  const myName = yourName || 'You';
  const theirName = opponentName || (mode === 'bot' ? 'Robot' : 'Friend');

  let status;
  if (result) {
    if (result.draw) {
      status = 'Draw!';
    } else if (result.winner === you) {
      status = `${myName} won!`;
    } else {
      status = `${theirName} won!`;
    }
  } else if (!opponentHere) {
    status = `${myName} waiting for opponent...`;
  } else if (turn === you) {
    status = `${myName}'s turn`;
  } else {
    status = mode === 'bot' ? 'Robot thinking...' : `${theirName}'s turn`;
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
          <span className="text-xs sm:text-sm font-medium">{myName}</span>
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

      {reconnectNotice && (
        <div className="mb-4 bg-card border border-primary rounded-lg p-3 animate-fade-in">
          <p className="text-sm text-center font-medium">{reconnectNotice}</p>
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
