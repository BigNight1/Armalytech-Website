/**
 * Clickable filter pill (design: category/status filter row above the
 * Inventario and Clientes tables). Unlike `Tag` (a static badge), `Chip` is
 * always a `<button>` and carries an `active` boolean instead of a variant.
 */
export default function Chip({ active = false, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center gap-1.5 border px-3 text-sm font-semibold transition-colors ${
        active ? 'border-ink bg-ink text-bg' : 'border-line bg-transparent text-ink hover:bg-surface'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
