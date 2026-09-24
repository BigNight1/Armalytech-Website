import { useCallback, useMemo, useState } from 'react';
import { Spinner } from '../shared/ui/index.js';
import { todayInLima } from '../shared/lib/time.js';
import { addDays } from './lib/dateRange.js';
import { computeGridTotals } from './lib/totals.js';
import { useCashClosingsGrid } from './hooks/useCashClosingsGrid.js';
import { useCashClosingsSummary } from './hooks/useCashClosingsSummary.js';
import DateNav from './components/DateNav.jsx';
import CashClosingsGrid from './components/CashClosingsGrid.jsx';
import TotalsBar from './components/TotalsBar.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';

/**
 * Historial container: the daily cash-closing spreadsheet (`cierre_dia`)
 * plus the day/week/month resumen. Port of the desktop app's `CierreDeDia`.
 */
export default function CashClosingsPage() {
  const [selectedDate, setSelectedDate] = useState(() => todayInLima());
  const today = useMemo(() => todayInLima(), []);

  const { rows, isLoading, rowStatus, savedVersion, updateCell, saveRow, addRows, deleteRow } =
    useCashClosingsGrid(selectedDate);
  const { weekTotals, monthTotals, weekLabel, monthLabel } = useCashClosingsSummary(selectedDate, savedVersion);

  const dayTotals = useMemo(() => computeGridTotals(rows), [rows]);

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

      <TotalsBar totals={dayTotals} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
        {isLoading ? (
          <div className="flex justify-center rounded-lg border border-slate-700 py-10">
            <Spinner />
          </div>
        ) : (
          <CashClosingsGrid
            rows={rows}
            rowStatus={rowStatus}
            onCellChange={updateCell}
            onCellCommit={saveRow}
            onAddRows={addRows}
            onDeleteRow={deleteRow}
          />
        )}

        <SummaryPanel
          dayTotals={dayTotals}
          weekTotals={weekTotals}
          monthTotals={monthTotals}
          weekLabel={weekLabel}
          monthLabel={monthLabel}
        />
      </div>
    </div>
  );
}
