const VARIANT_CLASSES = {
  primary: 'bg-brand-orange text-white hover:bg-brand-orange-600 focus-visible:outline-brand-orange',
  secondary: 'bg-slate-700 text-brand-ink hover:bg-slate-600 focus-visible:outline-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-400',
  ghost: 'bg-transparent text-brand-ink hover:bg-slate-800 focus-visible:outline-slate-500',
};

/** Presentational button. Pick a `variant`, everything else forwards to `<button>`. */
export default function Button({ variant = 'primary', className = '', type = 'button', children, ...rest }) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
