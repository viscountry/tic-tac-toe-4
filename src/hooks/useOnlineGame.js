import { useEffect, useRef, useState } from 'react';

// Opens a WebSocket for as long as the component is mounted.
// `intent` is the first message: { type: 'create' } or { type: 'join', code }.
export function useOnlineGame(intent, onFatal) {
  const [state, setState] = useState(null); // latest snapshot from the server
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
      const sessionData = localStorage.getItem('gameSession');
      
      // Check if we should attempt reconnection
      let shouldReconnect = false;
      let reconnectCode = null;
      let reconnectSymbol = null;
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          const timeSinceDisconnect = Date.now() - (session.timestamp || 0);
          
          // If disconnected less than 3 minutes ago, try to reconnect
          if (timeSinceDisconnect < 3 * 60 * 1000) {
            // If joining the same room as saved session, reconnect
            if (intent.type === 'join' && session.code === intent.code) {
              shouldReconnect = true;
              reconnectCode = session.code;
              reconnectSymbol = session.symbol;
            }
            // If creating room but have a recent session, try to reconnect to it instead
            else if (intent.type === 'create' && session.code) {
              shouldReconnect = true;
              reconnectCode = session.code;
              reconnectSymbol = session.symbol;
            }
          }
        } catch (e) {
          // Invalid session data, proceed with normal create/join
        }
      }
      
      if (shouldReconnect && reconnectCode) {
        ws.send(JSON.stringify({
          type: 'reconnect',
          code: reconnectCode,
          playerName: playerName,
          previousSymbol: reconnectSymbol
        }));
      } else {
        // Normal create/join flow
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
        setNotice(m.opponentName ? `${m.opponentName} left. Share the room code to invite them back.` : 'Your friend left. Share the room code to invite them back.');
      }
      else if (m.type === 'reconnected') {
        setReconnectNotice("You're back in the game!");
        setTimeout(() => setReconnectNotice(''), 3000);
      }
      else if (m.type === 'opponent_reconnected') {
        setReconnectNotice(m.opponentName ? `${m.opponentName} reconnected` : 'Your friend reconnected');
        setTimeout(() => setReconnectNotice(''), 3000);
      }
    };
    
    ws.onclose = () => {
      if (!closedByUs) {
        // Don't clear session - keep it for reconnection attempts
        fatal.current('Connection lost. Create or join a room to try again.');
      }
    };

    return () => {
      closedByUs = true;
      ws.close();
    };
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
