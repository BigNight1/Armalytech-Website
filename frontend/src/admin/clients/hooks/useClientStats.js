import { useCallback, useEffect, useState } from 'react';
import { clientsApi } from '../api/clientsApi.js';
import { todayInLima } from '../../shared/lib/time.js';
import { limaDayRangeUtc } from '../lib/format.js';

/**
 * Lightweight header stats (no dedicated backend endpoint): total clients,
 * visits today, and clients with marketing consent approved. Kept cheap by
 * asking for `limit: 1` and reading `total` from the paginated response.
 */
export function useClientStats() {
  const [stats, setStats] = useState({ totalClients: 0, visitsToday: 0, approvedConsent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = todayInLima();
      const { from, to } = limaDayRangeUtc(today);
      const [allClients, approvedClients, todayEvents] = await Promise.all([
        clientsApi.listClients({ page: 1, limit: 1 }),
        clientsApi.listClients({ page: 1, limit: 1, consent: 'approved' }),
        clientsApi.listEvents({ from, to }),
      ]);

      setStats({
        totalClients: allClients.total,
        approvedConsent: approvedClients.total,
        visitsToday: todayEvents.filter((event) => event.type !== 'registro_rechazado').length,
      });
    } catch {
      // Stats are a soft header, not critical data — fail quietly and keep
      // the table/toast handling as the source of truth for real errors.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...stats, isLoading, refetch };
}
