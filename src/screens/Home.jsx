import { useState } from 'react';

export default function Home({ onNavigate }) {
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleModeClick = (mode) => {
    if (mode === 'bot') {
      onNavigate('bot');
    } else {
      setPendingMode(mode);
      setShowNameModal(true);
      setName('');
      setError('');
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    
    if (trimmedName.length > 15) {
      setError('Name must be 15 characters or less');
      return;
    }
    
    localStorage.setItem('playerName', trimmedName);
    setShowNameModal(false);
    onNavigate(pendingMode);
  };

  return (
    <>
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">Tic-Tac-Four</h1>
          <p className="text-sm sm:text-base text-muted">Connect four on a 7×6 board</p>
        </div>
        
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => handleModeClick('friend')}
            className="w-full bg-card active:bg-bg-secondary border border-border rounded-xl p-5 sm:p-6 transition-all text-left active:scale-[0.98]"
          >
            <h3 className="text-base sm:text-lg font-semibold mb-1">Play with Friend</h3>
            <p className="text-xs sm:text-sm text-muted">Online multiplayer</p>
          </button>
          
          <button
            onClick={() => handleModeClick('bot')}
            className="w-full bg-card active:bg-bg-secondary border border-border rounded-xl p-5 sm:p-6 transition-all text-left active:scale-[0.98]"
          >
            <h3 className="text-base sm:text-lg font-semibold mb-1">Play vs Robot</h3>
            <p className="text-xs sm:text-sm text-muted">Challenge the AI</p>
          </button>
        </div>
        
        <p className="mt-10 text-xs text-muted">Made by Onve</p>
      </section>

      {showNameModal && (
        <div className="fixed inset-0 bg-bg/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm animate-fade-in">
            <h2 className="text-xl font-bold mb-4">What's your name?</h2>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name"
                autoFocus
                maxLength={15}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 mb-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {error && (
                <p className="text-red-500 text-sm mb-3">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 bg-bg border border-border rounded-lg py-3 text-sm font-medium active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-fg rounded-lg py-3 text-sm font-medium active:scale-95 transition-transform"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
