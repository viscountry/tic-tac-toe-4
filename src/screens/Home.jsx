import Button from '../components/Button.jsx';

export default function Home({ onNavigate }) {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="mb-8">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          TIC-TAC-FOUR
        </h1>
      </div>
      
      <p className="text-lg sm:text-xl text-muted mb-12 max-w-md">
        Connect four on a 7×6 board
      </p>
      
      <div className="w-full max-w-md space-y-4">
        <div 
          onClick={() => onNavigate('friend')}
          className="cursor-pointer bg-card hover:bg-card-hover border-2 border-border hover:border-primary rounded-2xl p-6 transition-all hover:scale-105 active:scale-100"
        >
          <h3 className="text-xl font-bold mb-2">Play with a Friend</h3>
          <p className="text-sm text-muted">Online multiplayer with room codes</p>
        </div>
        
        <div 
          onClick={() => onNavigate('bot')}
          className="cursor-pointer bg-card hover:bg-card-hover border-2 border-border hover:border-accent rounded-2xl p-6 transition-all hover:scale-105 active:scale-100"
        >
          <h3 className="text-xl font-bold mb-2">Play the Robot</h3>
          <p className="text-sm text-muted">Challenge the AI</p>
        </div>
      </div>
      
      <div className="mt-16 text-muted text-sm">
        Onve
      </div>
    </section>
  );
}
