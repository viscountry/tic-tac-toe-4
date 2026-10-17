import { useState } from 'react';
import Button from '../components/Button.jsx';
import Segmented from '../components/Segmented.jsx';

export default function BotSetup({ onBack, onStart }) {
  const [level, setLevel] = useState('hard');
  const [side, setSide] = useState('X');

  return (
    <section className="max-w-md mx-auto px-4 py-8">
      <Button variant="link" onClick={onBack}>← Back</Button>
      
      <div className="mt-8 mb-8">
        <h2 className="text-3xl font-bold mb-2">Play vs Robot</h2>
        <p className="text-muted">Configure your game</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <label className="block text-sm font-semibold mb-3">Difficulty</label>
          <Segmented options={['easy', 'hard']} value={level} onChange={setLevel} />
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <label className="block text-sm font-semibold mb-3">Play as</label>
          <Segmented options={['X', 'O']} value={side} onChange={setSide} />
        </div>

        <Button onClick={() => onStart({ level, side })}>Start Game</Button>
      </div>
    </section>
  );
}
