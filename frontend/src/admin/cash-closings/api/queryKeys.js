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
  // Ticket cobros (T-C3) — a shared prefix so annulling one invalidates every
  // cached day/week/month range in one call.
  cobrosAll: () => [...cashClosingsKeys.all, 'cobros'],
  cobros: (from, to) => [...cashClosingsKeys.cobrosAll(), from, to],
};
