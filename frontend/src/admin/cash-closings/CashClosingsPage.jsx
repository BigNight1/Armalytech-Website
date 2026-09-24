import { useCallback, useMemo, useState } from 'react';
import { SkeletonTable } from '../shared/ui/index.js';
import { useDelayedFlag } from '../shared/lib/useDelayedFlag.js';
import { todayInLima } from '../shared/lib/time.js';
import { addDays } from './lib/dateRange.js';
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
  const summaryTitle = summaryTab === 'day' ? SUMMARY_TITLES.day : `${SUMMARY_TITLES[summaryTab]} (${label})`;

  const goPrevDay = useCallback(() => setSelectedDate((current) => addDays(current, -1)), []);
  const goNextDay = useCallback(() => setSelectedDate((current) => addDays(current, 1)), []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-brand-ink">Historial</h1>

      <DateNav
        selectedDate={selectedDate}
        isToday={selectedDate === today}
        maxDate={today}
        onPrevDay={goPrevDay}
        onNextDay={goNextDay}
        onPickDate={setSelectedDate}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {showGridLoading ? (
          <SkeletonTable rows={8} columns={6} />
        ) : (
          <CashClosingsGrid
            rows={rows}
            rowStatus={rowStatus}
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
          isLoading={showSummaryLoading}
        />
      </div>
    </div>
  );
}
