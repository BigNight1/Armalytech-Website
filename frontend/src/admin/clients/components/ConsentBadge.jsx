/** "Acepta promociones" badge: Aprobó (green) when true, Descartó (muted/red) when false. */
export default function ConsentBadge({ approved }) {
  const classes = approved
    ? 'bg-green-500/15 text-green-400 border-green-500/30'
    : 'bg-red-500/10 text-red-400/80 border-red-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {approved ? 'Aprobó' : 'Descartó'}
    </span>
  );
}
