import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { ShoppingBag } from 'lucide-react';
import { Button, SkeletonTable } from '../shared/ui/index.js';
import { useBreadcrumb } from '../shared/layout/breadcrumb.jsx';
import { useDelayedFlag } from '../shared/lib/useDelayedFlag.js';
import { todayInLima } from '../shared/lib/time.js';
import { useAuth } from '../auth/useAuth.js';
import { addDays, formatDateLabel } from './lib/dateRange.js';
import { computeGridTotals, cobrosSummaryLine } from './lib/totals.js';
import { useCashClosingsGrid } from './hooks/useCashClosingsGrid.js';
import { useCashClosingsSummary } from './hooks/useCashClosingsSummary.js';
import { useAnularCobro, useCobros } from './hooks/useCobros.js';
import DateNav from './components/DateNav.jsx';
import CashClosingsGrid from './components/CashClosingsGrid.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
import AnularCobroDialog from './components/AnularCobroDialog.jsx';
import RegisterSaleDrawer from './components/RegisterSaleDrawer.jsx';
import CobroDetailModal from './components/CobroDetailModal.jsx';
import { cashClosingsKeys } from './api/queryKeys.js';

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
  useBreadcrumb(null); // Historial has no sub-tab route; the header's own "Historial del día" crumb is enough.

  const { admin } = useAuth();
  const isOwner = admin?.role === 'owner';

  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => todayInLima());
  const [summaryTab, setSummaryTab] = useState('day');
  const [anularTarget, setAnularTarget] = useState(null);
  const [selectedCobroDetail, setSelectedCobroDetail] = useState(null);
  const [showSaleDrawer, setShowSaleDrawer] = useState(false);
  const today = useMemo(() => todayInLima(), []);

  const { rows, isLoading, rowStatus, updateCell, saveRow, addRow, deleteRow } =
    useCashClosingsGrid(selectedDate);
  const {
    totals: tabTotals,
    label,
    cobrosSummary: tabCobrosSummary,
    isLoading: isSummaryLoading,
  } = useCashClosingsSummary(selectedDate, summaryTab);

  // T-C3: the day's ticket cobros (locked Historial rows, created by the
  // Tickets module when an advance/balance is collected) — folded into the
  // day totals/resumen alongside the manual grid rows.
  const dayCobros = useCobros(selectedDate, selectedDate);
  const anularCobro = useAnularCobro();

  const dayTotals = useMemo(() => computeGridTotals(rows, dayCobros.active), [rows, dayCobros.active]);
  const dayCobrosSummary = useMemo(() => cobrosSummaryLine(dayCobros.active), [dayCobros.active]);

  const showGridLoading = useDelayedFlag(isLoading || dayCobros.isLoading);
  const showSummaryLoading = useDelayedFlag(isSummaryLoading);

  const summaryTotals = summaryTab === 'day' ? dayTotals : tabTotals;
  const summaryCobros = summaryTab === 'day' ? dayCobrosSummary : tabCobrosSummary;
  const summaryTitle = SUMMARY_TITLES[summaryTab];
  const summaryRange = summaryTab === 'day' ? formatDateLabel(selectedDate) : label;

  const goPrevDay = useCallback(() => setSelectedDate((current) => addDays(current, -1)), []);
  const goNextDay = useCallback(() => setSelectedDate((current) => addDays(current, 1)), []);

  function handleSaleSuccess() {
    queryClient.invalidateQueries({ queryKey: cashClosingsKeys.cobrosAll() });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }

  function handleAnularConfirm(motivo) {
    if (!anularTarget) return;
    anularCobro.mutate(
      { id: anularTarget.id, motivo },
      { onSuccess: () => setAnularTarget(null) },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>Historial del día · Panel Armalytech</title>
      </Helmet>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">Cierre de día</span>
          <h1>Historial del día</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => setShowSaleDrawer(true)}>
            <ShoppingBag size={16} />
            <span>Registrar venta</span>
          </Button>

          <DateNav
            selectedDate={selectedDate}
            isToday={selectedDate === today}
            maxDate={today}
            onPrevDay={goPrevDay}
            onNextDay={goNextDay}
            onPickDate={setSelectedDate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        {showGridLoading ? (
          <SkeletonTable rows={8} columns={6} />
        ) : (
          <CashClosingsGrid
            rows={rows}
            rowStatus={rowStatus}
            totals={dayTotals}
            cobros={dayCobros.cobros}
            isOwner={isOwner}
            onAnularRequest={setAnularTarget}
            onCobroSelect={setSelectedCobroDetail}
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
          cobrosSummary={summaryCobros}
          title={summaryTitle}
          range={summaryRange}
          isLoading={showSummaryLoading}
        />
      </div>

      <RegisterSaleDrawer
        open={showSaleDrawer}
        onClose={() => setShowSaleDrawer(false)}
        onSuccess={handleSaleSuccess}
      />

      <CobroDetailModal
        cobro={selectedCobroDetail}
        isOwner={isOwner}
        onClose={() => setSelectedCobroDetail(null)}
        onAnularRequest={(cobro) => {
          setSelectedCobroDetail(null);
          setAnularTarget(cobro);
        }}
      />

      <AnularCobroDialog
        cobro={anularTarget}
        loading={anularCobro.isPending}
        onConfirm={handleAnularConfirm}
        onCancel={() => setAnularTarget(null)}
      />
    </div>
  );
}
