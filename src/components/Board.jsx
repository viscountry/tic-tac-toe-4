import Mark from './Mark.jsx';

export default function Board({ board, winCells = [], canPlay, onPlay }) {
  return (
    <div className="inline-block">
      <div className="grid grid-cols-7 gap-0 bg-border" style={{ padding: '2px' }}>
        {board.map((cell, i) => {
          const isWin = winCells.includes(i);
          const canClick = canPlay && !cell;
          return (
            <button
              key={i}
              onClick={() => canClick && onPlay(i)}
              disabled={!canClick}
              style={{ margin: '2px' }}
              className={`flex h-14 w-14 items-center justify-center transition-all ${
                isWin
                  ? 'bg-primary/30 border-2 border-primary'
                  : cell
                  ? 'bg-card'
                  : canClick
                  ? 'bg-bg-secondary hover:bg-card cursor-pointer'
                  : 'bg-bg opacity-50 cursor-not-allowed'
              }`}
              aria-label={`Cell ${i}`}
            >
              {cell && <Mark player={cell} className="h-8 w-8" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
