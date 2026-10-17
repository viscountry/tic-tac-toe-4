export default function Home({ onNavigate }) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">Tic-Tac-Four</h1>
        <p className="text-sm sm:text-base text-muted">Connect four on a 7×6 board</p>
      </div>
      
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => onNavigate('friend')}
          className="w-full bg-card active:bg-bg-secondary border border-border rounded-xl p-5 sm:p-6 transition-all text-left active:scale-[0.98]"
        >
          <h3 className="text-base sm:text-lg font-semibold mb-1">Play with Friend</h3>
          <p className="text-xs sm:text-sm text-muted">Online multiplayer</p>
        </button>
        
        <button
          onClick={() => onNavigate('bot')}
          className="w-full bg-card active:bg-bg-secondary border border-border rounded-xl p-5 sm:p-6 transition-all text-left active:scale-[0.98]"
        >
          <h3 className="text-base sm:text-lg font-semibold mb-1">Play vs Robot</h3>
          <p className="text-xs sm:text-sm text-muted">Challenge the AI</p>
        </button>
      </div>
      
      <p className="mt-10 text-xs text-muted">Made by Onve</p>
    </section>
  );
}
