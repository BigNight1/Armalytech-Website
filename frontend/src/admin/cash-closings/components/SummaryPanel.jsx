import ResumenBlock from './ResumenBlock.jsx';
import { formatPEN } from '../../shared/lib/money.js';
import { Skeleton } from '../../shared/ui/index.js';

const TABS = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

/**
 * Day/week/month resumen aside — port of the desktop `CierreResumenPanel` +
 * `CierreDeDiaResumen` merged into one presentational component. Purely
 * presentational: `activeTab` is owned by the container (T14), which fetches
 * only the visible tab's range instead of all three at once. Layout matches
 * the design's Historial aside: tab switcher, title + date range, an
 * accent-filled "Ingreso neto" highlight, then Efectivo / Yape breakdowns.
 */
export default function SummaryPanel({ activeTab, onTabChange, totals, title, range, isLoading }) {
  return (
    <aside className="flex flex-col gap-[18px] self-start border-t-2 border-ink pt-4">
      <div className="grid grid-cols-3 divide-x divide-line border border-line">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-2 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab.id ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <p style={{ fontSize: '22px' }} className="font-archivo font-extrabold tracking-[-0.015em] text-ink">
          {title}
        </p>
        {range && <span className="text-sm text-muted">{range}</span>}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col bg-accent p-[18px] text-on-accent">
            <span className="text-[13px] font-extrabold uppercase tracking-[0.12em]">Ingreso neto</span>
            <span className="text-[42px] font-extrabold leading-[1.1] tracking-[-0.02em] tabular-nums">
              {formatPEN(totals.netIncome)}
            </span>
            <span className="text-[15px] font-semibold">Bruto {formatPEN(totals.grossIncome)}</span>
          </div>

          <ResumenBlock
            title="Efectivo"
            income={totals.cashIncome}
            expense={totals.cashExpense}
            total={totals.totalCash}
          />
          <ResumenBlock
            title="Yape / Plin"
            income={totals.yapeIncome}
            expense={totals.yapeExpense}
            total={totals.totalYape}
          />
        </>
      )}
    </aside>
  );
}
