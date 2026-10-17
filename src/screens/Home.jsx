import Penguin from '../components/Penguin.jsx';

export default function Home({ onNavigate }) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <Penguin className="w-16 h-16 mx-auto mb-6 opacity-80" />
        <h1 className="text-4xl sm:text-5xl font-bold mb-2">Tic-Tac-Four</h1>
        <p className="text-muted">Connect four on a 7×6 board</p>
      </div>
      
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => onNavigate('friend')}
          className="w-full bg-card hover:bg-bg-secondary border border-border rounded-xl p-6 transition-all text-left group"
        >
          <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">Play with Friend</h3>
          <p className="text-sm text-muted">Online multiplayer</p>
        </button>
        
        <button
          onClick={() => onNavigate('bot')}
          className="w-full bg-card hover:bg-bg-secondary border border-border rounded-xl p-6 transition-all text-left group"
        >
          <h3 className="text-lg font-semibold mb-1 group-hover:text-secondary transition-colors">Play vs Robot</h3>
          <p className="text-sm text-muted">Challenge the AI</p>
        </button>
      </div>
      
      <p className="mt-12 text-xs text-muted">Made by Onve</p>
    </section>
  );
}
