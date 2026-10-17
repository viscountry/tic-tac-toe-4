export default function Button({ children, variant = 'primary', onClick, disabled, ...props }) {
  const baseClasses = 'rounded-lg px-5 sm:px-6 py-2.5 sm:py-3 font-semibold text-sm sm:text-base transition-all disabled:cursor-not-allowed disabled:opacity-50 active:scale-95';
  
  const variants = {
    primary: 'bg-primary text-white active:bg-primary-hover disabled:active:bg-primary',
    secondary: 'bg-card text-ink border border-border active:bg-bg-secondary disabled:active:bg-card',
    link: 'text-secondary active:text-primary px-0 py-0 text-sm',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
