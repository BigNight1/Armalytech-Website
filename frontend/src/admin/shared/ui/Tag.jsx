const VARIANT_CLASSES = {
  // Muted outline — default, e.g. a phone-compatibility pill in a table cell.
  neutral: 'border border-line text-ink',
  // Soft accent tint — e.g. loyalty/consent badges.
  accent: 'bg-accent-100 text-accent-900',
  // Solid accent fill — e.g. the "OWNER" role tag, "Hoy" indicator.
  solid: 'bg-accent text-on-accent',
  // Danger tint — e.g. "Bajo" (low stock) badge.
  danger: 'bg-danger-bg text-danger-ink',
};

/**
 * Small uppercase label/badge (design: role tags, stock/consent badges,
 * "Hoy" indicator). Not interactive — see `Chip` for a clickable pill.
 */
export default function Tag({ variant = 'neutral', className = '', children }) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
}
