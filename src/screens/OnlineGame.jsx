import { useOnlineGame } from '../hooks/useOnlineGame.js';
import GameView from '../components/GameView.jsx';

export default function OnlineGame({ intent, onLeave, onFatal }) {
  const { game, notice, reconnectNotice } = useOnlineGame(intent, onFatal);
  
  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted">
          {intent?.type === 'create' ? 'Creating room...' : 'Joining room...'}
        </p>
      </div>
    );
  }
  
  return <GameView game={game} mode="online" notice={notice} reconnectNotice={reconnectNotice} onLeave={onLeave} />;
}
