import { useCallback, useEffect, useState } from 'react';
import { clientsApi } from '../api/clientsApi.js';
import { useToast } from '../../shared/ui/index.js';

/** A single client's registro/visita/registro_rechazado history. */
export function useClientEvents(clientId) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { notify } = useToast();

  const refetch = useCallback(async () => {
    if (!clientId) {
      setEvents([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await clientsApi.getClientEvents(clientId);
      setEvents(data);
    } catch (err) {
      notify(err.message ?? 'No se pudo cargar el historial', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, notify]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { events, isLoading, refetch };
}
