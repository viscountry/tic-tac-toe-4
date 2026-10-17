import { useState } from 'react';
import Button from '../components/Button.jsx';

export default function FriendLobby({ initialCode, notice, onBack, onStart }) {
  const [code, setCode] = useState(initialCode);

  return (
    <section className="max-w-lg mx-auto">
      <Button variant="link" onClick={onBack}>← Back to Home</Button>
      
      <div className="mt-6 mb-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          👥 Play with a Friend
        </h2>
        <p className="text-muted">Create or join an online room</p>
      </div>

      {/* Create Room Card */}
      <div className="mb-6 bg-gradient-to-br from-card to-card-hover rounded-2xl p-6 border-2 border-border shadow-xl hover:shadow-2xl transition-all">
        <div className="text-center mb-4">
          <span className="text-5xl mb-3 block">🎮</span>
          <h3 className="text-xl font-bold mb-2">Create a New Room</h3>
          <p className="text-sm text-muted mb-4">Get a 5-letter code to share with your friend</p>
        </div>
        <Button onClick={() => onStart({ type: 'create' })}>
          ✨ Create Room
        </Button>
      </div>

      {/* Divider */}
      <div className="relative my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-sm font-bold text-muted uppercase tracking-wide px-3 py-1 bg-card rounded-full border border-border">or</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Join Room Card */}
      <div className="bg-gradient-to-br from-card to-card-hover rounded-2xl p-6 border-2 border-border shadow-xl">
        <div className="text-center mb-4">
          <span className="text-5xl mb-3 block">🔗</span>
          <h3 className="text-xl font-bold mb-2">Join Existing Room</h3>
        </div>
        
        <label htmlFor="code" className="mb-3 block text-sm font-bold text-muted uppercase tracking-wide">
          Enter Room Code
        </label>
        <input
          id="code"
          type="text"
          placeholder="ABCDE"
          maxLength={5}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full rounded-xl border-2 border-border bg-bg-secondary px-5 py-4 text-center text-2xl sm:text-3xl tracking-[0.3em] font-black focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/20 transition-all mb-4"
        />

        <Button onClick={() => onStart({ type: 'join', code })} disabled={code.length !== 5}>
          🚪 Join Room
        </Button>
      </div>

      {/* Notice */}
      {notice && (
        <div role="alert" className="mt-6 bg-card-hover border-2 border-primary/50 rounded-xl p-4">
          <p className="text-sm text-center text-primary">⚠️ {notice}</p>
        </div>
      )}
    </section>
  );
}
