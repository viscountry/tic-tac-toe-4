import { useState } from 'react';
import Button from '../components/Button.jsx';

export default function FriendLobby({ initialCode, notice, onBack, onStart }) {
  const [code, setCode] = useState(initialCode);

  return (
    <section className="min-h-screen flex flex-col px-4 py-6 sm:py-8">
      <Button variant="link" onClick={onBack}>← Back</Button>
      
      <div className="mt-8 mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Play with Friend</h2>
        <p className="label-small">Multiplayer via room codes</p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-8 max-w-md mx-auto w-full">
        <div className="bg-card rounded p-6 border border-border">
          <h3 className="font-semibold mb-2">Create Room</h3>
          <p className="text-xs sm:text-sm text-muted mb-4">Get a code to share</p>
          <Button onClick={() => onStart({ type: 'create' })}>Create Room</Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-bg px-2 text-muted uppercase tracking-wider">or</span>
          </div>
        </div>

        <div className="bg-card rounded p-6 border border-border">
          <h3 className="font-semibold mb-4">Join Room</h3>
          <label htmlFor="code" className="label-small block mb-2">Room Code</label>
          <input
            id="code"
            type="text"
            placeholder="ABCDE"
            maxLength={5}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full rounded border border-border bg-bg px-4 py-3 text-center text-xl sm:text-2xl tracking-widest font-mono font-semibold mb-4"
          />
          <Button onClick={() => onStart({ type: 'join', code })} disabled={code.length !== 5}>
            Join Room
          </Button>
        </div>

        {notice && (
          <div className="bg-error/10 border border-error rounded p-3">
            <p className="text-xs sm:text-sm text-error font-mono">{notice}</p>
          </div>
        )}
      </div>
    </section>
  );
}
