/**
 * TanStack Query key factory for the Historial (cash-closings) feature
 * (T14). `summaryAll()` is a shared prefix so a row save/delete can
 * invalidate every cached day/week/month summary range in one call.
 */
export const cashClosingsKeys = {
  all: ['cash-closings'],
  rows: (date) => [...cashClosingsKeys.all, 'rows', date],
  summaryAll: () => [...cashClosingsKeys.all, 'summary'],
  summary: (groupBy, from, to) => [...cashClosingsKeys.summaryAll(), groupBy, from, to],
};
