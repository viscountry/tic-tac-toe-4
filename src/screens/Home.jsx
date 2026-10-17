import Button from '../components/Button.jsx';

export default function Home({ onNavigate }) {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      {/* Hero Title with glow effect */}
      <div className="mb-8 relative">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-pulse">
          TIC-TAC-FOUR
        </h1>
        <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 -z-10" />
      </div>
      
      <p className="text-lg sm:text-xl text-muted mb-12 max-w-md">
        Get four in a row on a <span className="text-secondary font-bold">7×6 board</span>
      </p>
      
      {/* Game mode cards */}
      <div className="w-full max-w-md space-y-4">
        <div 
          onClick={() => onNavigate('friend')}
          className="group cursor-pointer bg-card hover:bg-card-hover border-2 border-border hover:border-primary rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl active:scale-100"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Play with a Friend</h3>
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-sm text-muted">Challenge someone online with a room code</p>
        </div>
        
        <div 
          onClick={() => onNavigate('bot')}
          className="group cursor-pointer bg-card hover:bg-card-hover border-2 border-border hover:border-accent rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl active:scale-100"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold group-hover:text-accent transition-colors">Play the Robot</h3>
            <span className="text-3xl">🤖</span>
          </div>
          <p className="text-sm text-muted">Test your skills against AI</p>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="mt-16 flex gap-3 items-center justify-center text-muted text-sm">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <span>Onve</span>
        <span className="w-2 h-2 bg-secondary rounded-full animate-pulse delay-75" />
      </div>
    </section>
  );
}
