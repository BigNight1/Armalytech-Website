import { useEffect, useState } from 'react';
import { cashClosingsApi } from '../api/cashClosingsApi.js';
import { getMonthRange, getWeekRange, formatMonthLabel, formatWeekLabel } from '../lib/dateRange.js';
import { emptyTotals, summaryGroupToTotals } from '../lib/totals.js';

/**
 * Fetches the week/month resumen totals via `GET /cash-closings/summary`
 * for the range containing `selectedDate`. Refetches when `refreshToken`
 * changes (bumped by the grid hook after a successful save/delete) so the
 * resumen stays in sync with edits without a full page reload.
 */
export function useCashClosingsSummary(selectedDate, refreshToken) {
  const [weekTotals, setWeekTotals] = useState(emptyTotals());
  const [monthTotals, setMonthTotals] = useState(emptyTotals());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const { start: weekStart, end: weekEnd } = getWeekRange(selectedDate);
    const { start: monthStart, end: monthEnd } = getMonthRange(selectedDate);
    setIsLoading(true);

    Promise.all([
      cashClosingsApi.getSummary(weekStart, weekEnd, 'week'),
      cashClosingsApi.getSummary(monthStart, monthEnd, 'month'),
    ])
      .then(([weekGroups, monthGroups]) => {
        if (cancelled) return;
        setWeekTotals(summaryGroupToTotals(weekGroups?.[0]));
        setMonthTotals(summaryGroupToTotals(monthGroups?.[0]));
      })
      .catch(() => {
        if (cancelled) return;
        setWeekTotals(emptyTotals());
        setMonthTotals(emptyTotals());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, refreshToken]);

  return {
    weekTotals,
    monthTotals,
    isLoading,
    weekLabel: formatWeekLabel(selectedDate),
    monthLabel: formatMonthLabel(selectedDate),
  };
}
