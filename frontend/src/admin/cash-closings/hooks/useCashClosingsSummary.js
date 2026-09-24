import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cashClosingsApi } from '../api/cashClosingsApi.js';
import { cashClosingsKeys } from '../api/queryKeys.js';
import { getMonthRange, getWeekRange, formatMonthLabel, formatWeekLabel } from '../lib/dateRange.js';
import { emptyTotals, summaryGroupToTotals } from '../lib/totals.js';

/**
 * Fetches the resumen totals for exactly the tab currently visible in
 * `SummaryPanel` (T14: previously this always fetched week AND month
 * together, even while showing "Día"). `activeTab` is `'day' | 'week' |
 * 'month'`; the "day" tab needs no request — its totals are computed live
 * from the grid rows by the caller — so this hook simply returns the cached
 * `emptyTotals()` shape and `isLoading: false` for it.
 */
export function useCashClosingsSummary(selectedDate, activeTab) {
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(selectedDate), [selectedDate]);
  const { start: monthStart, end: monthEnd } = useMemo(() => getMonthRange(selectedDate), [selectedDate]);

  const range = activeTab === 'week' ? { from: weekStart, to: weekEnd } : { from: monthStart, to: monthEnd };

  const query = useQuery({
    queryKey: cashClosingsKeys.summary(activeTab, range.from, range.to),
    queryFn: () => cashClosingsApi.getSummary(range.from, range.to, activeTab),
    enabled: activeTab === 'week' || activeTab === 'month',
    placeholderData: (previous) => previous,
  });

  const totals = activeTab === 'day' ? emptyTotals() : summaryGroupToTotals(query.data?.[0]);
  const label = activeTab === 'week' ? formatWeekLabel(selectedDate) : formatMonthLabel(selectedDate);

  return {
    totals,
    label,
    isLoading: activeTab === 'day' ? false : query.isLoading,
  };
}
