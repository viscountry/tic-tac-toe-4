export default function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border-2 border-border bg-card p-1.5 shadow-md">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-lg px-6 py-2.5 font-bold transition-all ${
            value === opt
              ? 'bg-gradient-to-r from-primary to-red-600 text-white shadow-lg scale-105'
              : 'text-muted hover:text-ink hover:bg-card-hover'
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}
