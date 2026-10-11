import { cashClosingsApi } from './cashClosingsApi.js';
import { cashClosingsKeys } from './queryKeys.js';
import { todayInLima } from '../../shared/lib/time.js';

/**
 * Warms the cache for the Historial section's first query (today's rows) so
 * the page renders instantly once the user clicks the sidebar link (T14:
 * prefetch on hover/focus).
 */
export function prefetchCashClosings(queryClient) {
  const today = todayInLima();
  return queryClient.prefetchQuery({
    queryKey: cashClosingsKeys.rows(today),
    queryFn: () => cashClosingsApi.listRows(today, today),
  });
}
