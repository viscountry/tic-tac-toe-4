export default function Button({ children, variant = 'primary', onClick, disabled, ...props }) {
  const baseClasses = 'rounded-xl px-6 py-3.5 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 relative overflow-hidden';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-red-600 text-white hover:from-primary-hover hover:to-red-700 shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:hover:from-primary disabled:hover:to-red-600',
    secondary: 'bg-card text-ink border-2 border-border hover:border-secondary hover:bg-card-hover shadow-md disabled:hover:bg-card',
    link: 'text-secondary hover:text-primary px-0 py-0 shadow-none hover:translate-x-1',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
