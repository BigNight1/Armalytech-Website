/** Presentational select. `options` is `[{ value, label }]`. */
export default function Select({ label, error, id, options = [], className = '', ...rest }) {
  const selectId = id ?? rest.name;

  return (
    <label className="flex flex-col gap-1 text-sm text-brand-ink" htmlFor={selectId}>
      {label && <span className="font-medium">{label}</span>}
      <select
        id={selectId}
        className={`rounded-lg border bg-slate-900 px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-orange ${
          error ? 'border-red-500' : 'border-slate-700'
        } ${className}`}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
}
