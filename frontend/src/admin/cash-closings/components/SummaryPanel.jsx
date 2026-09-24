import ResumenBlock from './ResumenBlock.jsx';
import { Skeleton } from '../../shared/ui/index.js';

const TABS = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

/**
 * Day/week/month resumen tabs — port of the desktop `CierreResumenPanel` +
 * `CierreDeDiaResumen` merged into one presentational component. Purely
 * presentational: `activeTab` is owned by the container (T14), which fetches
 * only the visible tab's range instead of all three at once.
 */
export default function SummaryPanel({ activeTab, onTabChange, totals, title, isLoading }) {
  return (
    <div className="flex flex-col gap-3 self-start rounded-lg border border-slate-700 bg-brand-navy-light/60 p-4">
      <div className="flex gap-1 rounded-lg bg-slate-900 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeTab === tab.id ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-brand-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <>
          <ResumenBlock
            title="Efectivo"
            rows={[
              { label: 'Ingreso efectivo', value: totals.cashIncome },
              { label: 'Gasto efectivo', value: totals.cashExpense },
              { label: 'Total efectivo', value: totals.totalCash, emphasize: true },
            ]}
          />
          <ResumenBlock
            title="Yape / Plin"
            rows={[
              { label: 'Ingreso Yape', value: totals.yapeIncome },
              { label: 'Gasto Yape', value: totals.yapeExpense },
              { label: 'Total Yape', value: totals.totalYape, emphasize: true },
            ]}
          />
          <ResumenBlock
            title="Totales"
            rows={[
              { label: 'Ingreso bruto', value: totals.grossIncome },
              { label: 'Ingreso neto', value: totals.netIncome, emphasize: true },
            ]}
          />
        </>
      )}
    </div>
  );
}
