import { useState, useEffect } from 'react';
import Home from './screens/Home.jsx';
import BotSetup from './screens/BotSetup.jsx';
import FriendLobby from './screens/FriendLobby.jsx';
import BotGame from './screens/BotGame.jsx';
import OnlineGame from './screens/OnlineGame.jsx';

// Invite links look like /?room=ABCDE
const getInviteCode = () => (new URLSearchParams(location.search).get('room') || '').toUpperCase().slice(0, 5);

export default function App() {
  const inviteCode = getInviteCode();
  const [screen, setScreen] = useState(inviteCode ? 'onlineGame' : 'home'); // home | bot | friend | botGame | onlineGame
  const [botOpts, setBotOpts] = useState({ level: 'hard', side: 'X' });
  const [intent, setIntent] = useState(inviteCode ? { type: 'join', code: inviteCode } : null);
  const [notice, setNotice] = useState('');

  // Auto-join room when invite link is used
  useEffect(() => {
    const code = getInviteCode();
    if (code && screen === 'home') {
      setIntent({ type: 'join', code });
      setScreen('onlineGame');
    }
  }, [screen]);

  return (
    <main className="min-h-screen mx-auto w-full max-w-[600px] px-4 sm:px-6 pt-6 sm:pt-12 pb-12 sm:pb-16">
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
            // Clear URL params when leaving
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
    </main>
  );
}
