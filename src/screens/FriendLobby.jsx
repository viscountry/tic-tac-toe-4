import { useState } from 'react';
import Button from '../components/Button.jsx';

export default function FriendLobby({ initialCode, notice, onBack, onStart }) {
  const [code, setCode] = useState(initialCode);

  return (
    <section>
      <Button variant="link" onClick={onBack}>← Back</Button>
      <h2 className="mt-3 mb-6 text-3xl font-extrabold tracking-tight">Play with a friend</h2>

      <div className="mb-5">
        <Button onClick={() => onStart({ type: 'create' })}>Create a room</Button>
        <p className="mt-2 text-sm text-muted">You'll get a code to share</p>
      </div>

      <div className="relative my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-3">
        <label htmlFor="code" className="mb-2 block text-sm font-semibold">Join with a code</label>
        <input
          id="code"
          type="text"
          placeholder="ABCDE"
          maxLength={5}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-center text-xl tracking-[0.2em] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <Button onClick={() => onStart({ type: 'join', code })} disabled={code.length !== 5}>
        Join room
      </Button>

      {notice && <p role="alert" className="mt-4 text-sm text-muted">{notice}</p>}
    </section>
  );
}
