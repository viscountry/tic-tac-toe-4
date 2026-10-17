export default function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded border border-border bg-bg p-1 w-full sm:w-auto">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 sm:flex-none rounded px-5 sm:px-6 py-2 sm:py-2.5 font-semibold text-sm sm:text-base transition-all duration-150 ${
            value === opt
              ? 'bg-primary text-white'
              : 'text-muted hover:bg-card hover:text-ink'
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}
