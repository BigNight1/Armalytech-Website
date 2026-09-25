import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../api/clientsApi.js';
import { clientsKeys } from '../api/queryKeys.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';

/** A single client's registro/visita/registro_rechazado history (T14: TanStack Query). */
export function useClientEvents(clientId) {

  const query = useQuery({
    queryKey: clientsKeys.events(clientId),
    queryFn: () => clientsApi.getClientEvents(clientId),
    enabled: Boolean(clientId),
  });

  useQueryErrorToast(query.error, 'No se pudo cargar el historial');

  return { events: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch };
}
