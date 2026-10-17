import Mark from './Mark.jsx';

export default function Board({ board, winCells = [], canPlay, onPlay }) {
  return (
    <div className="inline-grid grid-cols-7 gap-2 sm:gap-3 rounded-2xl bg-card border-2 border-border p-3 sm:p-4 shadow-xl">
      {board.map((cell, i) => {
        const isWin = winCells.includes(i);
        const canClick = canPlay && !cell;
        return (
          <button
            key={i}
            onClick={() => canClick && onPlay(i)}
            disabled={!canClick}
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border-2 transition-all duration-200 ${
              isWin
                ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                : cell
                ? 'border-border bg-bg-secondary'
                : canClick
                ? 'border-border bg-bg-secondary hover:border-secondary hover:bg-card-hover hover:scale-105 hover:shadow-md cursor-pointer active:scale-95'
                : 'border-border bg-bg cursor-not-allowed opacity-50'
            }`}
            aria-label={`Cell ${i}`}
          >
            {cell && <Mark player={cell} className={`h-7 w-7 sm:h-8 sm:w-8 ${isWin ? 'drop-shadow-glow' : ''}`} />}
          </button>
        );
      })}
    </div>
  );
}
