export default function Button({ children, variant = 'primary', onClick, disabled, ...props }) {
  const baseClasses = 'rounded-lg px-5 py-2.5 font-semibold text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 border';
  
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50 disabled:hover:bg-primary/10',
    secondary: 'bg-card text-ink border-border hover:border-secondary/50 hover:bg-card-hover disabled:hover:bg-card',
    link: 'text-secondary hover:text-primary px-0 py-0 border-0',
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
