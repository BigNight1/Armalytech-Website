import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cobrosApi } from '../api/cobrosApi.js';
import { cashClosingsKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';

/**
 * Ticket cobros (`adelanto|saldo|venta`) for `[from, to]` (T-C3): they're
 * created by the Tickets module (C1) when an advance/balance is collected,
 * land in the Historial grid as locked rows, and count towards its totals.
 * `cobros` keeps annulled ones (shown struck-through so history stays
 * visible); `active` excludes them for totals math.
 */
export function useCobros(from, to, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: cashClosingsKeys.cobros(from, to),
    queryFn: () => cobrosApi.listCobros(from, to),
    enabled,
  });

  const cobros = query.data ?? [];
  const active = useMemo(() => cobros.filter((c) => !c.anulado), [cobros]);

  return {
    cobros,
    active,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Owner-only `POST /cobros/:id/anular` (backend enforces the role + the 409
 * "already annulled" guard — this just turns both into a clear toast).
 * Invalidates every cached cobros range plus the row/summary caches so the
 * grid, day totals and resumen panel drop the annulled cobro together.
 */
export function useAnularCobro() {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  return useMutation({
    mutationFn: ({ id, motivo }) => cobrosApi.anularCobro(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashClosingsKeys.cobrosAll() });
      queryClient.invalidateQueries({ queryKey: cashClosingsKeys.summaryAll() });
      notify('Cobro anulado correctamente.', { type: 'success' });
    },
    onError: (error) => {
      if (error?.status === 409) {
        notify('Ese cobro ya estaba anulado.', { type: 'error' });
      } else if (error?.status === 403) {
        notify('Solo el propietario puede anular cobros.', { type: 'error' });
      } else {
        notify(error?.message || 'No se pudo anular el cobro.', { type: 'error' });
      }
    },
  });
}
