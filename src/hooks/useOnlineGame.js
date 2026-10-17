import { useEffect, useRef, useState } from 'react';

// Opens a WebSocket for as long as the component is mounted.
// `intent` can be:
//   { type: 'create' }
//   { type: 'join', code }
//   { type: 'reconnect', code, previousSymbol }
export function useOnlineGame(intent, onFatal) {
  const [state, setState] = useState(null);
  const [notice, setNotice] = useState('');
  const [reconnectNotice, setReconnectNotice] = useState('');
  const wsRef = useRef(null);
  const fatal = useRef(onFatal);
  fatal.current = onFatal;

  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    wsRef.current = ws;
    let closedByUs = false;

    ws.onopen = () => {
      const playerName = localStorage.getItem('playerName') || 'Player';

      if (intent.type === 'reconnect') {
        // Try reconnecting to existing room
        ws.send(JSON.stringify({
          type: 'reconnect',
          code: intent.code,
          playerName,
          previousSymbol: intent.previousSymbol
        }));
      } else {
        // Normal create or join
        ws.send(JSON.stringify({ ...intent, playerName }));
      }
    };

    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.type === 'state') {
        setState(m);
        setNotice('');

        // Save session for reconnection
        if (m.code && m.you) {
          localStorage.setItem('gameSession', JSON.stringify({
            code: m.code,
            symbol: m.you,
            timestamp: Date.now()
          }));
        }
      }
      else if (m.type === 'error') fatal.current(m.message);
      else if (m.type === 'opponent_left') {
        setNotice(m.opponentName
          ? `${m.opponentName} left. Share the room code to invite them back.`
          : 'Your friend left. Share the room code to invite them back.');
      }
      else if (m.type === 'reconnected') {
        setReconnectNotice("You're back in the game!");
        setTimeout(() => setReconnectNotice(''), 3000);
      }
      else if (m.type === 'opponent_reconnected') {
        setReconnectNotice(m.opponentName
          ? `${m.opponentName} reconnected`
          : 'Your friend reconnected');
        setTimeout(() => setReconnectNotice(''), 3000);
      }
    };

    ws.onclose = () => {
      if (!closedByUs) {
        fatal.current('Connection lost. Create or join a room to try again.');
      }
    };

    return () => { closedByUs = true; ws.close(); };
  }, [intent]);

  const send = (msg) => wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify(msg));
  const game = state && {
    ...state,
    play: (index) => send({ type: 'move', index }),
    rematch: () => send({ type: 'rematch' }),
    rematchWaiting: state.rematchVotes.includes(state.you),
  };
  return { game, notice, reconnectNotice };
}
