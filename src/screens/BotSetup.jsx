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
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
          Play the Robot
        </h2>
        <p className="text-muted">Choose your settings</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-6 border-2 border-border">
          <label className="mb-3 block text-sm font-bold text-muted uppercase tracking-wide">Difficulty</label>
          <Segmented options={['easy', 'hard']} value={level} onChange={setLevel} />
          <p className="mt-3 text-xs text-muted">
            {level === 'easy' ? 'Casual play' : 'Advanced AI'}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 border-2 border-border">
          <label className="mb-3 block text-sm font-bold text-muted uppercase tracking-wide">Play as</label>
          <Segmented options={['X', 'O']} value={side} onChange={setSide} />
          <p className="mt-3 text-xs text-muted">
            {side === 'X' ? 'You go first' : 'Robot goes first'}
          </p>
        </div>

        <Button onClick={() => onStart({ level, side })}>
          Start Game
        </Button>
      </div>
    </section>
  );
}
