import { useState } from 'react';
import Button from '../components/Button.jsx';
import Segmented from '../components/Segmented.jsx';

export default function BotSetup({ onBack, onStart }) {
  const [level, setLevel] = useState('hard');
  const [side, setSide] = useState('X');

  return (
    <section className="max-w-lg mx-auto">
      <Button variant="link" onClick={onBack}>← Back</Button>
      
      <div className="mt-6 mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Play the Robot</h2>
        <p className="text-sm text-muted font-mono">Configure game settings</p>
      </div>

      <div className="space-y-4">
        <div className="bg-card rounded-lg p-5 border border-border">
          <label className="mb-3 block text-xs font-semibold text-muted uppercase tracking-wider">Difficulty</label>
          <Segmented options={['easy', 'hard']} value={level} onChange={setLevel} />
          <p className="mt-3 text-xs text-muted font-mono">
            {level === 'easy' ? '> Casual mode' : '> Advanced AI'}
          </p>
        </div>

        <div className="bg-card rounded-lg p-5 border border-border">
          <label className="mb-3 block text-xs font-semibold text-muted uppercase tracking-wider">Side</label>
          <Segmented options={['X', 'O']} value={side} onChange={setSide} />
          <p className="mt-3 text-xs text-muted font-mono">
            {side === 'X' ? '> You start first' : '> Robot starts first'}
          </p>
        </div>

        <Button onClick={() => onStart({ level, side })}>
          Start Game
        </Button>
      </div>
    </section>
  );
}
