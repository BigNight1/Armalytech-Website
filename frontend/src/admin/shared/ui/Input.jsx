// Field heights/type sizes from the design: `md` (42px/15px, default —
// dense tables/inline filters), `lg` (46px/15px — drawers, dialogs, account
// forms), `xl` (50px/16px — the login screen's fields).
const SIZE_CLASSES = {
  md: 'min-h-[42px] px-3 py-2 text-[15px]',
  lg: 'min-h-[46px] px-3 text-[15px]',
  xl: 'min-h-[50px] px-3 text-[16px]',
};

/**
 * Presentational text input with an optional label and error message.
 * `endAdornment` renders an absolutely-positioned node over the input's
 * right edge (e.g. the login/account password show/hide toggle) — the
 * caller is responsible for its own `pr-*` spacing via `className` so the
 * typed text doesn't run under it.
 */
export default function Input({ label, error, id, size = 'md', endAdornment, className = '', ...rest }) {
  const inputId = id ?? rest.name;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  const input = (
    <input
      id={inputId}
      className={`w-full border bg-surface text-ink placeholder:text-muted focus:outline-none focus-visible:border-accent ${sizeClass} ${
        error ? 'border-danger' : 'border-line'
      } ${className}`}
      {...rest}
    />
  );

  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink" htmlFor={inputId}>
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      {endAdornment ? (
        <div className="relative">
          {input}
          {endAdornment}
        </div>
      ) : (
        input
      )}
      {error && <span className="text-xs text-danger-ink">{error}</span>}
    </label>
  );
}
