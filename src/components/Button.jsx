export default function Button({ children, variant = 'primary', onClick, disabled, ...props }) {
  const baseClasses = 'rounded px-5 sm:px-6 py-2.5 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary: 'bg-primary text-white border border-primary hover:bg-primary-hover',
    secondary: 'bg-transparent text-ink border border-border hover:bg-card',
    link: 'text-primary-light hover:text-primary-light/80 underline px-0 py-0 text-sm border-0',
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
