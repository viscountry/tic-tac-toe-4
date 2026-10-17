import { useState } from 'react';
import Button from '../components/Button.jsx';
import Segmented from '../components/Segmented.jsx';

export default function BotSetup({ onBack, onStart }) {
  const [level, setLevel] = useState('hard');
  const [side, setSide] = useState('X');

  return (
    <section>
      <Button variant="link" onClick={onBack}>← Back</Button>
      <h2 className="mt-3 mb-6 text-3xl font-extrabold tracking-tight">Play the robot</h2>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-semibold">Difficulty</label>
        <Segmented options={['easy', 'hard']} value={level} onChange={setLevel} />
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-semibold">You play as</label>
        <Segmented options={['X', 'O']} value={side} onChange={setSide} />
      </div>

      <Button onClick={() => onStart({ level, side })}>Start game</Button>
    </section>
  );
}
