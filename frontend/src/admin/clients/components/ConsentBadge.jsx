/**
 * "Acepta promociones" badge: soft accent tint when approved, muted outline
 * when declined (design: `consentTag()` — normal case, not the uppercase
 * `Tag` treatment, so this stays a small local span instead of reusing
 * `shared/ui/Tag`).
 */
export default function ConsentBadge({ approved }) {
  const classes = approved ? 'bg-accent-100 text-accent-800' : 'border border-line text-muted';

  return (
    <span className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 text-[13px] font-bold ${classes}`}>
      {approved ? 'Aprobó' : 'Descartó'}
    </span>
  );
}
