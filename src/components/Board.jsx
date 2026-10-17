import Mark from './Mark.jsx';

export default function Board({ board, winCells = [], canPlay, onPlay }) {
  return (
    <div className="inline-grid grid-cols-7 gap-2 rounded-xl bg-bg-secondary p-3">
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
                ? 'border-primary bg-primary/10'
                : cell
                ? 'border-border bg-bg'
                : canClick
                ? 'border-border bg-bg hover:border-primary hover:bg-primary/5 cursor-pointer'
                : 'border-border bg-bg cursor-not-allowed'
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
