import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../api/clientsApi.js';
import { clientsKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';

/** A single client's registro/visita/registro_rechazado history (T14: TanStack Query). */
export function useClientEvents(clientId) {
  const { notify } = useToast();

  const query = useQuery({
    queryKey: clientsKeys.events(clientId),
    queryFn: () => clientsApi.getClientEvents(clientId),
    enabled: Boolean(clientId),
  });

  if (query.error) {
    notify(query.error.message ?? 'No se pudo cargar el historial', { type: 'error' });
  }

  return { events: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch };
}
