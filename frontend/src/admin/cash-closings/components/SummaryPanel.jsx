import { useState } from 'react';
import ResumenBlock from './ResumenBlock.jsx';

const TABS = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

/**
 * Day/week/month resumen tabs — port of the desktop `CierreResumenPanel` +
 * `CierreDeDiaResumen` merged into one presentational component.
 */
export default function SummaryPanel({ dayTotals, weekTotals, monthTotals, weekLabel, monthLabel }) {
  const [activeTab, setActiveTab] = useState('day');

  const totalsByTab = { day: dayTotals, week: weekTotals, month: monthTotals };
  const titleByTab = {
    day: 'Resumen del día',
    week: weekLabel ? `Semana (${weekLabel})` : 'Semana',
    month: monthLabel ? `Mes (${monthLabel})` : 'Mes',
  };

  const totals = totalsByTab[activeTab];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-brand-navy-light/60 p-4">
      <div className="flex gap-1 rounded-lg bg-slate-900 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeTab === tab.id ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-brand-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-brand-ink">{titleByTab[activeTab]}</h3>

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
    </div>
  );
}
