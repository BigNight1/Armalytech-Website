// Same size scale as `Input` — keep both in sync (see Input.jsx).
const SIZE_CLASSES = {
  md: 'min-h-[42px] px-3 py-2 text-[15px]',
  lg: 'min-h-[46px] px-3 text-[15px]',
  xl: 'min-h-[50px] px-3 text-[16px]',
};

/** Presentational select. `options` is `[{ value, label }]`. */
export default function Select({ label, error, id, options = [], size = 'md', className = '', ...rest }) {
  const selectId = id ?? rest.name;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink" htmlFor={selectId}>
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <select
        id={selectId}
        className={`w-full border bg-surface text-ink focus:outline-none focus-visible:border-accent ${sizeClass} ${
          error ? 'border-danger' : 'border-line'
        } ${className}`}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger-ink">{error}</span>}
    </label>
  );
}
