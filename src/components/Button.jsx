export default function Button({ children, variant = 'primary', onClick, disabled, ...props }) {
  const baseClasses = 'rounded-lg px-6 py-3 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover disabled:hover:bg-primary',
    secondary: 'bg-bg-secondary text-ink border border-border hover:bg-border disabled:hover:bg-bg-secondary',
    link: 'text-primary hover:underline px-0 py-0',
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
