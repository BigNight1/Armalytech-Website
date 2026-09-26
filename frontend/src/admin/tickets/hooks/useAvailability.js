import { useQuery } from '@tanstack/react-query';
import { ticketQueryKeys } from '../api/queryKeys.js';
import { ticketsApi } from '../api/ticketsApi.js';

/**
 * Piece availability for the "Piezas" step of the new-ticket form:
 * `GET /api/tickets/availability?categoriaId=&celularId=` — products in
 * that category compatible with that phone, with `stock`, `planificado`
 * (reserved by other pending tickets) and `disponible` already computed
 * server-side. Only runs once both filters are picked.
 */
export function useAvailability({ categoriaId, celularId, excludeTicketId, q, categoria } = {}) {
  const enabled = Boolean(categoriaId || celularId || q || categoria);
  const params = { categoriaId, celularId, excludeTicketId, q, categoria };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ticketQueryKeys.availability(params),
    queryFn: () => ticketsApi.getAvailability(params),
    enabled,
  });

  return {
    items: enabled ? (data ?? []) : [],
    isLoading: enabled && isLoading,
    isError,
    error,
  };
}
