import Mark from './Mark.jsx';

export default function Board({ board, winCells = [], canPlay, onPlay }) {
  return (
    <div className="inline-grid grid-cols-7 gap-2 rounded-lg bg-card border border-border p-3">
      {board.map((cell, i) => {
        const isWin = winCells.includes(i);
        const canClick = canPlay && !cell;
        return (
          <button
            key={i}
            onClick={() => canClick && onPlay(i)}
            disabled={!canClick}
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-md border transition-all ${
              isWin
                ? 'border-primary bg-primary/10'
                : cell
                ? 'border-border bg-bg-secondary'
                : canClick
                ? 'border-border bg-bg-secondary hover:border-secondary/50 hover:bg-card cursor-pointer'
                : 'border-border bg-bg opacity-40 cursor-not-allowed'
            }`}
            aria-label={`Cell ${i}`}
          >
            {cell && <Mark player={cell} className="h-7 w-7 sm:h-8 sm:w-8" />}
          </button>
        );
      })}
    </div>
  );
}
