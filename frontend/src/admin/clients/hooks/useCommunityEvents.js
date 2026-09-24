import { useCallback, useEffect, useState } from 'react';
import { clientsApi } from '../api/clientsApi.js';
import { useToast } from '../../shared/ui/index.js';
import { todayInLima } from '../../shared/lib/time.js';
import { limaDayRangeUtc } from '../lib/format.js';

function defaultRange() {
  const today = todayInLima();
  const from = new Date(limaDayRangeUtc(today).from);
  from.setUTCDate(from.getUTCDate() - 6); // last 7 days including today
  return { from: from.toISOString().slice(0, 10), to: today };
}

/** Cross-client "Actividad" event log with a date range + type filter. */
export function useCommunityEvents() {
  const [range, setRange] = useState(defaultRange);
  const [type, setType] = useState('all'); // 'all' | 'registro' | 'visita' | 'registro_rechazado'
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { notify } = useToast();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { from } = limaDayRangeUtc(range.from);
      const { to } = limaDayRangeUtc(range.to);
      const data = await clientsApi.listEvents({
        from,
        to,
        type: type === 'all' ? undefined : type,
      });
      setEvents(data);
    } catch (err) {
      notify(err.message ?? 'No se pudo cargar la actividad', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [range, type, notify]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { events, isLoading, range, setRange, type, setType, refetch };
}
