import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../api/clientsApi.js';
import { clientsKeys } from '../api/queryKeys.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';

/**
 * Ficha 360°'s "Historial de servicios" tab (T-C3): a client's repair
 * tickets from `GET /community/clients/:id/tickets` — a dedicated,
 * already-shaped endpoint (no client-side phone fallback needed, unlike the
 * old inline section this replaces).
 */
export function useClientTickets(clientId) {
  const query = useQuery({
    queryKey: clientsKeys.tickets(clientId),
    queryFn: () => clientsApi.getClientTickets(clientId),
    enabled: Boolean(clientId),
  });

  useQueryErrorToast(query.error, 'No se pudo cargar el historial de servicios');

  return { tickets: query.data ?? [], isLoading: query.isLoading };
}
