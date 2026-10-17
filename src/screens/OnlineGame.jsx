import { useOnlineGame } from '../hooks/useOnlineGame.js';
import GameView from '../components/GameView.jsx';

export default function OnlineGame({ intent, onLeave, onFatal }) {
  const { game, notice } = useOnlineGame(intent, onFatal);
  return game ? <GameView game={game} mode="online" notice={notice} onLeave={onLeave} /> : <p>Connecting…</p>;
}
