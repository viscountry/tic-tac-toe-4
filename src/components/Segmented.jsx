export default function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-md px-5 py-2 font-semibold text-sm transition-all ${
            value === opt
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-muted hover:text-ink hover:bg-card-hover'
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}
