import { useState } from 'react';
import Home from './screens/Home.jsx';
import BotSetup from './screens/BotSetup.jsx';
import FriendLobby from './screens/FriendLobby.jsx';
import BotGame from './screens/BotGame.jsx';
import OnlineGame from './screens/OnlineGame.jsx';

const getInviteCode = () => (new URLSearchParams(location.search).get('room') || '').toUpperCase().slice(0, 5);

// Check if there's a recent game session to reconnect to
function getSavedSession() {
  try {
    const data = localStorage.getItem('gameSession');
    if (!data) return null;
    const session = JSON.parse(data);
    const age = Date.now() - (session.timestamp || 0);
    // Only reconnect if session is less than 3 minutes old
    if (age < 3 * 60 * 1000 && session.code && session.symbol) {
      return session;
    }
  } catch (e) {}
  return null;
}

export default function App() {
  const inviteCode = getInviteCode();
  const savedSession = getSavedSession();

  // Determine initial screen:
  // 1. Invite code in URL → ask name then auto-join
  // 2. Recent saved session → auto-reconnect
  // 3. Neither → home screen
  let initialScreen = 'home';
  let initialIntent = null;

  if (inviteCode) {
    // Invite link: need to ask for name first, then auto-join
    initialScreen = 'inviteJoin';
    initialIntent = { type: 'join', code: inviteCode };
  } else if (savedSession) {
    // Reconnect to saved session
    initialScreen = 'onlineGame';
    initialIntent = { type: 'reconnect', code: savedSession.code, previousSymbol: savedSession.symbol };
  }

  const [screen, setScreen] = useState(initialScreen);
  const [botOpts, setBotOpts] = useState({ level: 'hard', side: 'X' });
  const [intent, setIntent] = useState(initialIntent);
  const [notice, setNotice] = useState('');

  // For invite link: show name modal then auto-join
  const [inviteName, setInviteName] = useState('');
  const [inviteError, setInviteError] = useState('');

  const handleInviteNameSubmit = (e) => {
    e.preventDefault();
    const trimmed = inviteName.trim();
    if (!trimmed) { setInviteError('Please enter your name'); return; }
    if (trimmed.length > 15) { setInviteError('Name must be 15 characters or less'); return; }
    localStorage.setItem('playerName', trimmed);
    // Go directly to game - no FriendLobby needed
    setIntent({ type: 'join', code: inviteCode });
    setScreen('onlineGame');
  };

  return (
    <>
      {screen === 'home' && <Home onNavigate={setScreen} />}
      {screen === 'bot' && (
        <BotSetup onBack={() => setScreen('home')} onStart={(o) => { setBotOpts(o); setScreen('botGame'); }} />
      )}
      {screen === 'friend' && (
        <FriendLobby
          initialCode=""
          notice={notice}
          onBack={() => setScreen('home')}
          onStart={(i) => { setNotice(''); setIntent(i); setScreen('onlineGame'); }}
        />
      )}
      {screen === 'botGame' && <BotGame {...botOpts} onLeave={() => setScreen('home')} />}

      {/* Invite link flow: ask for name then auto-join */}
      {screen === 'inviteJoin' && (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded p-6 w-full max-w-sm animate-fade-in">
            <h2 className="text-xl font-bold mb-2">Join Game</h2>
            <p className="text-sm text-muted mb-4">Room <span className="font-mono font-bold">{inviteCode}</span></p>
            <form onSubmit={handleInviteNameSubmit}>
              <label className="label-small block mb-2">What's your name?</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => { setInviteName(e.target.value); setInviteError(''); }}
                placeholder="Enter your name"
                autoFocus
                maxLength={15}
                className="w-full bg-bg border border-border rounded px-4 py-3 mb-2 text-base"
              />
              {inviteError && <p className="text-error text-sm mb-3">{inviteError}</p>}
              <button
                type="submit"
                className="w-full bg-primary text-white border border-primary rounded py-3 text-sm font-medium hover:bg-primary-hover transition-all duration-150"
              >
                Join Game
              </button>
            </form>
          </div>
        </div>
      )}

      {screen === 'onlineGame' && (
        <OnlineGame
          intent={intent}
          onLeave={() => {
            localStorage.removeItem('gameSession');
            window.history.replaceState({}, '', location.pathname);
            setScreen('home');
          }}
          onFatal={(msg) => {
            localStorage.removeItem('gameSession');
            setNotice(msg);
            window.history.replaceState({}, '', location.pathname);
            setScreen('friend');
          }}
        />
      )}
    </>
  );
}
