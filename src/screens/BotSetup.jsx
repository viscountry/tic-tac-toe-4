import { useState } from 'react';
import Button from '../components/Button.jsx';
import Segmented from '../components/Segmented.jsx';

export default function BotSetup({ onBack, onStart }) {
  const [level, setLevel] = useState('hard');
  const [side, setSide] = useState('X');

  return (
    <section className="min-h-screen flex flex-col px-4 py-6 sm:py-8">
      <Button variant="link" onClick={onBack}>← Back</Button>
      
      <div className="mt-8 mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Play vs Robot</h2>
        <p className="label-small">Configure your game</p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-8 max-w-md mx-auto w-full">
        <div className="bg-card rounded p-6 border border-border">
          <label className="label-small block mb-3">Difficulty</label>
          <Segmented options={['easy', 'hard']} value={level} onChange={setLevel} />
        </div>

        <div className="bg-card rounded p-6 border border-border">
          <label className="label-small block mb-3">Play as</label>
          <Segmented options={['X', 'O']} value={side} onChange={setSide} />
        </div>

        <Button onClick={() => onStart({ level, side })}>Start Game</Button>
      </div>
    </section>
  );
}
