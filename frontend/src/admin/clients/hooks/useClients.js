import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clientsApi.js';
import { clientsKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';

const PAGE_SIZE = 20;

/** Searchable, paginated, consent-filterable client list (T14: TanStack Query). */
export function useClients() {
  const [query, setQuery] = useState('');
  const [consent, setConsent] = useState('all'); // 'all' | 'approved' | 'declined'
  const [page, setPage] = useState(1);
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const params = { q: query, page, limit: PAGE_SIZE, consent: consent === 'all' ? undefined : consent };

  const listQuery = useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => clientsApi.listClients(params),
    placeholderData: keepPreviousData,
  });

  useQueryErrorToast(listQuery.error, 'No se pudieron cargar los clientes');

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => clientsApi.updateClient(id, changes),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientsKeys.all });
      notify('Cliente actualizado', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo actualizar el cliente', { type: 'error' }),
  });

  return {
    items: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    isLoading: listQuery.isLoading,
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
    refetch: listQuery.refetch,
    updateClient: (id, changes) => updateMutation.mutateAsync({ id, changes }),
  };
}
