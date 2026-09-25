import { useCallback, useMemo, useState } from 'react';
import { SkeletonTable } from '../shared/ui/index.js';
import { useBreadcrumb } from '../shared/layout/breadcrumb.jsx';
import { useDelayedFlag } from '../shared/lib/useDelayedFlag.js';
import { todayInLima } from '../shared/lib/time.js';
import { addDays, formatDateLabel } from './lib/dateRange.js';
import { computeGridTotals } from './lib/totals.js';
import { useCashClosingsGrid } from './hooks/useCashClosingsGrid.js';
import { useCashClosingsSummary } from './hooks/useCashClosingsSummary.js';
import DateNav from './components/DateNav.jsx';
import CashClosingsGrid from './components/CashClosingsGrid.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';

const SUMMARY_TITLES = {
  day: 'Resumen del día',
  week: 'Semana',
  month: 'Mes',
};

/**
 * Historial container: the daily cash-closing spreadsheet (`cierre_dia`)
 * plus the day/week/month resumen. Port of the desktop app's `CierreDeDia`.
 * T14: the resumen only fetches the currently visible tab's range.
 */
export default function CashClosingsPage() {
  useBreadcrumb(null); // Historial has no sub-tab route; the header's own "Historial de caja" crumb is enough.

  const [selectedDate, setSelectedDate] = useState(() => todayInLima());
  const [summaryTab, setSummaryTab] = useState('day');
  const today = useMemo(() => todayInLima(), []);

  const { rows, isLoading, rowStatus, updateCell, saveRow, addRow, deleteRow } =
    useCashClosingsGrid(selectedDate);
  const { totals: tabTotals, label, isLoading: isSummaryLoading } = useCashClosingsSummary(
    selectedDate,
    summaryTab,
  );

  const dayTotals = useMemo(() => computeGridTotals(rows), [rows]);
  const showGridLoading = useDelayedFlag(isLoading);
  const showSummaryLoading = useDelayedFlag(isSummaryLoading);

  const summaryTotals = summaryTab === 'day' ? dayTotals : tabTotals;
  const summaryTitle = SUMMARY_TITLES[summaryTab];
  const summaryRange = summaryTab === 'day' ? formatDateLabel(selectedDate) : label;

  const goPrevDay = useCallback(() => setSelectedDate((current) => addDays(current, -1)), []);
  const goNextDay = useCallback(() => setSelectedDate((current) => addDays(current, 1)), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">Cierre de día</span>
          <h1>Historial de caja</h1>
        </div>

        <DateNav
          selectedDate={selectedDate}
          isToday={selectedDate === today}
          maxDate={today}
          onPrevDay={goPrevDay}
          onNextDay={goNextDay}
          onPickDate={setSelectedDate}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        {showGridLoading ? (
          <SkeletonTable rows={8} columns={6} />
        ) : (
          <CashClosingsGrid
            rows={rows}
            rowStatus={rowStatus}
            totals={dayTotals}
            onCellChange={updateCell}
            onCellCommit={saveRow}
            onAddRow={addRow}
            onDeleteRow={deleteRow}
          />
        )}

        <SummaryPanel
          activeTab={summaryTab}
          onTabChange={setSummaryTab}
          totals={summaryTotals}
          title={summaryTitle}
          range={summaryRange}
          isLoading={showSummaryLoading}
        />
      </div>
    </div>
  );
}
