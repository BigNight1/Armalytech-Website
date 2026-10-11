import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clientsApi.js';
import { clientsKeys } from '../api/queryKeys.js';
import { todayInLima } from '../../shared/lib/time.js';
import { limaDayRangeUtc } from '../lib/format.js';

/**
 * Lightweight header stats (no dedicated backend endpoint): total clients,
 * visits today, and clients with marketing consent approved. Kept cheap by
 * asking for `limit: 1` and reading `total` from the paginated response
 * (T14: TanStack Query; fails quietly — this is a soft header, not the
 * source of truth for real errors).
 */
export function useClientStats() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: clientsKeys.stats(),
    queryFn: async () => {
      const today = todayInLima();
      const { from, to } = limaDayRangeUtc(today);
      const [allClients, approvedClients, todayEvents] = await Promise.all([
        clientsApi.listClients({ page: 1, limit: 1 }),
        clientsApi.listClients({ page: 1, limit: 1, consent: 'approved' }),
        clientsApi.listEvents({ from, to }),
      ]);

      return {
        totalClients: allClients.total,
        approvedConsent: approvedClients.total,
        visitsToday: todayEvents.filter((event) => event.type !== 'registro_rechazado').length,
      };
    },
    // Soft header data: never surface an error toast for this, just keep the
    // previous numbers (or zeros) on screen.
    throwOnError: false,
  });

  const stats = query.data ?? { totalClients: 0, visitsToday: 0, approvedConsent: 0 };

  return {
    ...stats,
    isLoading: query.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: clientsKeys.stats() }),
  };
}
