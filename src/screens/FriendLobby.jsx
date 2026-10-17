import { useState } from 'react';
import Button from '../components/Button.jsx';

export default function FriendLobby({ initialCode, notice, onBack, onStart }) {
  const [code, setCode] = useState(initialCode);

  return (
    <section className="max-w-lg mx-auto">
      <Button variant="link" onClick={onBack}>← Back</Button>
      
      <div className="mt-6 mb-8">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
          Play with a Friend
        </h2>
        <p className="text-muted">Create or join a room</p>
      </div>

      <div className="mb-6 bg-card rounded-2xl p-6 border-2 border-border">
        <h3 className="text-xl font-bold mb-2">Create Room</h3>
        <p className="text-sm text-muted mb-4">Get a code to share</p>
        <Button onClick={() => onStart({ type: 'create' })}>
          Create Room
        </Button>
      </div>

      <div className="relative my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="bg-card rounded-2xl p-6 border-2 border-border">
        <h3 className="text-xl font-bold mb-4">Join Room</h3>
        
        <label htmlFor="code" className="mb-3 block text-sm font-bold text-muted uppercase tracking-wide">
          Room Code
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
          Join Room
        </Button>
      </div>

      {notice && (
        <div role="alert" className="mt-6 bg-card-hover border-2 border-primary/50 rounded-xl p-4">
          <p className="text-sm text-center text-primary">{notice}</p>
        </div>
      )}
    </section>
  );
}
