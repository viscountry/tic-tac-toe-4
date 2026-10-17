export default function Mark({ player, className = 'h-8 w-8' }) {
  if (player === 'X') {
    return (
      <svg className={`${className} text-primary drop-shadow-lg`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    );
  }
  return (
    <svg className={`${className} text-secondary drop-shadow-lg`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}
