import { useCallback, useEffect, useState } from 'react';
import { clientsApi } from '../api/clientsApi.js';
import { useToast } from '../../shared/ui/index.js';

const PAGE_SIZE = 20;

/** Searchable, paginated, consent-filterable client list. */
export function useClients() {
  const [query, setQuery] = useState('');
  const [consent, setConsent] = useState('all'); // 'all' | 'approved' | 'declined'
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { notify } = useToast();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await clientsApi.listClients({
        q: query,
        page,
        limit: PAGE_SIZE,
        consent: consent === 'all' ? undefined : consent,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      notify(err.message ?? 'No se pudieron cargar los clientes', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [query, page, consent, notify]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateClient = useCallback(
    async (id, changes) => {
      try {
        const updated = await clientsApi.updateClient(id, changes);
        await refetch();
        notify('Cliente actualizado', { type: 'success' });
        return updated;
      } catch (err) {
        notify(err.message ?? 'No se pudo actualizar el cliente', { type: 'error' });
        throw err;
      }
    },
    [refetch, notify],
  );

  return {
    items,
    total,
    isLoading,
    query,
    setQuery: (value) => {
      setPage(1);
      setQuery(value);
    },
    consent,
    setConsent: (value) => {
      setPage(1);
      setConsent(value);
    },
    page,
    setPage,
    pageSize: PAGE_SIZE,
    refetch,
    updateClient,
  };
}
