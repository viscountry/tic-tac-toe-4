import { useState } from 'react';
import Button from '../components/Button.jsx';

export default function FriendLobby({ initialCode, notice, onBack, onStart }) {
  const [code, setCode] = useState(initialCode);

  return (
    <section className="max-w-lg mx-auto">
      <Button variant="link" onClick={onBack}>← Back</Button>
      
      <div className="mt-6 mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Play with a Friend</h2>
        <p className="text-sm text-muted font-mono">Multiplayer via room codes</p>
      </div>

      <div className="mb-4 bg-card rounded-lg p-5 border border-border hover:border-primary/50 transition-colors">
        <h3 className="font-semibold mb-1">Create Room</h3>
        <p className="text-xs text-muted mb-4 font-mono">Generate a shareable code</p>
        <Button onClick={() => onStart({ type: 'create' })}>
          Create Room
        </Button>
      </div>

      <div className="relative my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted font-mono">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="bg-card rounded-lg p-5 border border-border">
        <h3 className="font-semibold mb-4">Join Room</h3>
        
        <label htmlFor="code" className="mb-2 block text-xs font-semibold text-muted uppercase tracking-wider">
          Room Code
        </label>
        <input
          id="code"
          type="text"
          placeholder="ABCDE"
          maxLength={5}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 text-center text-2xl tracking-[0.3em] font-bold focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all mb-4 font-mono"
        />

        <Button onClick={() => onStart({ type: 'join', code })} disabled={code.length !== 5}>
          Join Room
        </Button>
      </div>

      {notice && (
        <div role="alert" className="mt-4 bg-primary/10 border border-primary/30 rounded-lg p-3">
          <p className="text-xs text-primary font-mono">{notice}</p>
        </div>
      )}
    </section>
  );
}
