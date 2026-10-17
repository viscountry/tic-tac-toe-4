import Button from '../components/Button.jsx';
import Penguin from '../components/Penguin.jsx';

export default function Home({ onNavigate }) {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="mb-12">
        <div className="flex justify-center mb-6">
          <Penguin className="w-16 h-16 sm:w-20 sm:h-20 opacity-90" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3 text-ink">
          TIC-TAC-FOUR
        </h1>
        <p className="text-sm text-muted font-mono">Connect four on a 7×6 board</p>
      </div>
      
      <div className="w-full max-w-md space-y-3">
        <button
          onClick={() => onNavigate('friend')}
          className="w-full text-left bg-card hover:bg-card-hover border border-border hover:border-primary/50 rounded-lg p-4 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Play with a Friend</h3>
              <p className="text-xs text-muted">Online multiplayer</p>
            </div>
            <span className="text-muted group-hover:text-primary transition-colors">→</span>
          </div>
        </button>
        
        <button
          onClick={() => onNavigate('bot')}
          className="w-full text-left bg-card hover:bg-card-hover border border-border hover:border-secondary/50 rounded-lg p-4 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1 group-hover:text-secondary transition-colors">Play the Robot</h3>
              <p className="text-xs text-muted">Challenge the AI</p>
            </div>
            <span className="text-muted group-hover:text-secondary transition-colors">→</span>
          </div>
        </button>
      </div>
      
      <div className="mt-12 text-xs text-muted font-mono">
        Made by Onve
      </div>
    </section>
  );
}
