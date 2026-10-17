import { useState } from 'react';
import Home from './screens/Home.jsx';
import BotSetup from './screens/BotSetup.jsx';
import FriendLobby from './screens/FriendLobby.jsx';
import BotGame from './screens/BotGame.jsx';
import OnlineGame from './screens/OnlineGame.jsx';

// Invite links look like /?room=ABCDE
const inviteCode = (new URLSearchParams(location.search).get('room') || '').toUpperCase().slice(0, 5);

export default function App() {
  const [screen, setScreen] = useState(inviteCode ? 'friend' : 'home'); // home | bot | friend | botGame | onlineGame
  const [botOpts, setBotOpts] = useState({ level: 'hard', side: 'X' });
  const [intent, setIntent] = useState(null); // { type: 'create' } or { type: 'join', code }
  const [notice, setNotice] = useState('');

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
          onLeave={() => setScreen('home')}
          onFatal={(msg) => { setNotice(msg); setScreen('friend'); }}
        />
      )}
    </main>
  );
}
