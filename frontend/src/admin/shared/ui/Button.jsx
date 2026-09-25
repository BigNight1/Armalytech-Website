// Modernist look (design R1): 0 radius, 2px-strong borders where the design
// uses them, flush-left labels (per the task brief — the design's own .btn
// centers, but ArmalyTech wants left-aligned labels across the admin).
const VARIANT_CLASSES = {
  primary: 'border-accent bg-accent text-on-accent hover:bg-accent-600 active:bg-accent-700',
  secondary: 'border-line bg-transparent text-ink hover:bg-surface active:bg-row-hover',
  ghost: 'border-transparent bg-transparent text-accent-ink hover:bg-accent-100 active:bg-accent-200',
  danger: 'border-danger bg-danger text-white hover:brightness-95 active:brightness-90',
  // Square icon-only button (design: table row actions, popover triggers).
  icon: 'h-9 w-9 justify-center border-line bg-transparent p-0 text-ink hover:border-accent hover:text-accent-ink',
};

/** Presentational button. Pick a `variant`, everything else forwards to `<button>`. */
export default function Button({ variant = 'primary', className = '', type = 'button', children, ...rest }) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-start gap-2 border px-4 py-2.5 text-sm font-semibold font-archivo transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45 ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
