import Mark from './Mark.jsx';

export default function Board({ board, winCells = [], canPlay, onPlay }) {
  return (
    <div className="inline-grid grid-cols-7 gap-2 rounded-xl bg-card border border-border p-4">
      {board.map((cell, i) => {
        const isWin = winCells.includes(i);
        const canClick = canPlay && !cell;
        return (
          <button
            key={i}
            onClick={() => canClick && onPlay(i)}
            disabled={!canClick}
            className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 transition-all ${
              isWin
                ? 'border-primary bg-primary/20'
                : cell
                ? 'border-border bg-bg-secondary'
                : canClick
                ? 'border-border bg-bg-secondary hover:border-secondary cursor-pointer'
                : 'border-border bg-bg opacity-50 cursor-not-allowed'
            }`}
            aria-label={`Cell ${i}`}
          >
            {cell && <Mark player={cell} className="h-8 w-8" />}
          </button>
        );
      })}
    </div>
  );
}
