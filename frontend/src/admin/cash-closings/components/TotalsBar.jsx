import { formatPEN } from '../../shared/lib/money.js';

/** Compact row of live totals for the day being edited, above the grid. */
export default function TotalsBar({ totals }) {
  const items = [
    { label: 'Efectivo', value: totals.totalCash },
    { label: 'Yape', value: totals.totalYape },
    { label: 'Ingreso bruto', value: totals.grossIncome },
    { label: 'Ingreso neto', value: totals.netIncome, emphasize: true },
  ];

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-slate-700 bg-brand-navy-light/60 px-4 py-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-slate-400">{item.label}</span>
          <span className={`text-sm font-semibold ${item.emphasize ? 'text-brand-orange' : 'text-brand-ink'}`}>
            {formatPEN(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
