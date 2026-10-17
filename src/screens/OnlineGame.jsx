import { useOnlineGame } from '../hooks/useOnlineGame.js';
import GameView from '../components/GameView.jsx';

export default function OnlineGame({ intent, onLeave, onFatal }) {
  const { game, notice } = useOnlineGame(intent, onFatal);
  
  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
        <p className="text-xl font-bold text-muted">
          {intent?.type === 'create' ? 'Creating room...' : 'Joining room...'}
        </p>
        {intent?.type === 'join' && intent.code && (
          <p className="mt-2 text-sm text-muted">Room: {intent.code}</p>
        )}
      </div>
    );
  }
  
  return <GameView game={game} mode="online" notice={notice} onLeave={onLeave} />;
}
