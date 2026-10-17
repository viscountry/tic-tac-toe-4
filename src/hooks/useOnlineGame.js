import { useEffect, useRef, useState } from 'react';

// Opens a WebSocket for as long as the component is mounted.
// `intent` is the first message: { type: 'create' } or { type: 'join', code }.
export function useOnlineGame(intent, onFatal) {
  const [state, setState] = useState(null); // latest snapshot from the server
  const [notice, setNotice] = useState('');
  const wsRef = useRef(null);
  const fatal = useRef(onFatal);
  fatal.current = onFatal;

  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    wsRef.current = ws;
    let closedByUs = false;

    ws.onopen = () => ws.send(JSON.stringify(intent));
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.type === 'state') { setState(m); setNotice(''); }
      else if (m.type === 'error') fatal.current(m.message);
      else if (m.type === 'opponent_left') setNotice('Your friend left. Share the room code to invite them back.');
    };
    ws.onclose = () => { if (!closedByUs) fatal.current('Connection lost. Create or join a room to try again.'); };

    return () => { closedByUs = true; ws.close(); };
  }, [intent]);

  const send = (msg) => wsRef.current?.readyState === 1 && wsRef.current.send(JSON.stringify(msg));
  const game = state && {
    ...state,
    play: (index) => send({ type: 'move', index }),
    rematch: () => send({ type: 'rematch' }),
    rematchWaiting: state.rematchVotes.includes(state.you),
  };
  return { game, notice };
}
