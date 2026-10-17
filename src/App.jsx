import { useState } from 'react';
import Home from './screens/Home.jsx';
import BotSetup from './screens/BotSetup.jsx';
import FriendLobby from './screens/FriendLobby.jsx';
import BotGame from './screens/BotGame.jsx';
import OnlineGame from './screens/OnlineGame.jsx';

const getInviteCode = () => (new URLSearchParams(location.search).get('room') || '').toUpperCase().slice(0, 5);

export default function App() {
  const inviteCode = getInviteCode();
  // If there's an invite code, go to friend lobby (not straight to game) so they can enter their name
  const [screen, setScreen] = useState(inviteCode ? 'friend' : 'home');
  const [botOpts, setBotOpts] = useState({ level: 'hard', side: 'X' });
  const [intent, setIntent] = useState(null);
  const [notice, setNotice] = useState('');

  return (
    <>
      {screen === 'home' && <Home onNavigate={setScreen} />}
      {screen === 'bot' && (
        <BotSetup onBack={() => setScreen('home')} onStart={(o) => { setBotOpts(o); setScreen('botGame'); }} />
      )}
      {screen === 'friend' && (
        <FriendLobby
          initialCode={inviteCode}
          notice={notice}
          onBack={() => setScreen('home')}
          onStart={(i) => { setNotice(''); setIntent(i); setScreen('onlineGame'); }}
        />
      )}
      {screen === 'botGame' && <BotGame {...botOpts} onLeave={() => setScreen('home')} />}
      {screen === 'onlineGame' && (
        <OnlineGame
          intent={intent}
          onLeave={() => { 
            window.history.replaceState({}, '', location.pathname);
            setScreen('home'); 
          }}
          onFatal={(msg) => { 
            setNotice(msg); 
            window.history.replaceState({}, '', location.pathname);
            setScreen('friend'); 
          }}
        />
      )}
    </>
  );
}
