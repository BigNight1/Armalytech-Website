import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { clientsApi } from '../api/clientsApi.js';
import { clientsKeys } from '../api/queryKeys.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';
import { todayInLima } from '../../shared/lib/time.js';
import { limaDayRangeUtc } from '../lib/format.js';

function defaultRange() {
  const today = todayInLima();
  const from = new Date(limaDayRangeUtc(today).from);
  from.setUTCDate(from.getUTCDate() - 6); // last 7 days including today
  return { from: from.toISOString().slice(0, 10), to: today };
}

/** Cross-client "Actividad" event log with a date range + type filter (T14: TanStack Query). */
export function useCommunityEvents() {
  const [range, setRange] = useState(defaultRange);
  const [type, setType] = useState('all'); // 'all' | 'registro' | 'visita' | 'registro_rechazado'

  const { from } = limaDayRangeUtc(range.from);
  const { to } = limaDayRangeUtc(range.to);
  const params = { from, to, type: type === 'all' ? undefined : type };

  const query = useQuery({
    queryKey: clientsKeys.communityEvents(params),
    queryFn: () => clientsApi.listEvents(params),
    placeholderData: keepPreviousData,
  });

  useQueryErrorToast(query.error, 'No se pudo cargar la actividad');

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    range,
    setRange,
    type,
    setType,
    refetch: query.refetch,
  };
}
