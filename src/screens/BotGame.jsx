import { useBotGame } from '../hooks/useBotGame.js';
import GameView from '../components/GameView.jsx';

export default function BotGame({ level, side, onLeave }) {
  const game = useBotGame(level, side);
  return <GameView game={game} mode="bot" onLeave={onLeave} />;
}
