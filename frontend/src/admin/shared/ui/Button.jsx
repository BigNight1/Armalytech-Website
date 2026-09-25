// Modernist look (design R1): 0 radius, 2px-strong borders where the design
// uses them, flush-left labels (per the task brief — the design's own .btn
// centers, but ArmalyTech wants left-aligned labels across the admin).
const VARIANT_CLASSES = {
  primary: 'border-accent bg-accent text-on-accent hover:bg-accent-600 active:bg-accent-700',
  secondary: 'border-line bg-transparent text-ink hover:bg-surface active:bg-row-hover',
  ghost: 'border-transparent bg-transparent text-accent-ink hover:bg-accent-100 active:bg-accent-200',
  danger: 'border-danger bg-danger text-white hover:brightness-95 active:brightness-90',
  // Square icon-only button (design: 34x34 table row actions, popover triggers).
  icon: 'h-[34px] w-[34px] justify-center p-0 border-line bg-transparent text-ink hover:border-accent hover:text-accent-ink',
};

/** Presentational button. Pick a `variant`, everything else forwards to `<button>`. */
export default function Button({ variant = 'primary', className = '', type = 'button', children, ...rest }) {
  const isIcon = variant === 'icon';
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
  const layoutClass = isIcon ? 'p-0 justify-center' : 'px-4 py-2.5 justify-start gap-2';

  return (
    <button
      type={type}
      className={`inline-flex items-center border text-sm font-semibold font-archivo transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45 ${layoutClass} ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
