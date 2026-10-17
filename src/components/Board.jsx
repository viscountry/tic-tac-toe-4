import Mark from './Mark.jsx';

export default function Board({ board, winCells = [], canPlay, onPlay }) {
  return (
    <div className="inline-block">
      <div className="grid grid-cols-7 gap-[2px] bg-card-header rounded p-[2px]">
        {board.map((cell, i) => {
          const isWin = winCells.includes(i);
          const canClick = canPlay && !cell;
          return (
            <button
              key={i}
              onClick={() => canClick && onPlay(i)}
              disabled={!canClick}
              className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded transition-all active:scale-95 ${
                isWin
                  ? 'bg-primary/30'
                  : cell
                  ? 'bg-card'
                  : canClick
                  ? 'bg-bg-secondary active:bg-card cursor-pointer'
                  : 'bg-bg opacity-50 cursor-not-allowed'
              }`}
              aria-label={`Cell ${i}`}
            >
              {cell && <Mark player={cell} className="h-7 w-7 sm:h-8 sm:w-8" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
