import { formatPEN } from '../../shared/lib/money.js';

/** One resumen section (Efectivo / Yape / Totales) — a label+value list. */
export default function ResumenBlock({ title, rows }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
      {rows.map((row) => (
        <div
          key={row.label}
          className={`flex items-baseline justify-between text-sm ${
            row.emphasize ? 'font-semibold text-brand-orange' : 'text-brand-ink'
          }`}
        >
          <span>{row.label}</span>
          <strong>{formatPEN(row.value)}</strong>
        </div>
      ))}
    </div>
  );
}
