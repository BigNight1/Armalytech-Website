/** Presentational text input with an optional label and error message. */
export default function Input({ label, error, id, className = '', ...rest }) {
  const inputId = id ?? rest.name;

  return (
    <label className="flex flex-col gap-1 text-sm text-brand-ink" htmlFor={inputId}>
      {label && <span className="font-medium">{label}</span>}
      <input
        id={inputId}
        className={`rounded-lg border bg-slate-900 px-3 py-2 text-brand-ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-orange ${
          error ? 'border-red-500' : 'border-slate-700'
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
}
