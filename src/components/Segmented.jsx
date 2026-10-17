export default function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-bg-secondary p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded px-6 py-2 font-semibold transition-all ${
            value === opt
              ? 'bg-bg text-ink shadow-sm'
              : 'text-muted hover:text-ink'
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}
