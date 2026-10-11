import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketQueryKeys } from '../api/queryKeys.js';
import { ticketsApi } from '../api/ticketsApi.js';

const SEARCH_DEBOUNCE_MS = 250;

export function useTickets(initialFilters = {}) {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState(initialFilters.q || '');
  const [q, setQ] = useState(initialFilters.q || '');
  const [estadoFilter, setEstadoFilter] = useState(initialFilters.estado || '');
  const [tecnicoFilter, setTecnicoFilter] = useState(initialFilters.tecnicoId || '');
  const [page, setPage] = useState(initialFilters.page || 1);
  const pageSize = initialFilters.limit || 20;

  const searchTimer = useRef(null);
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  function handleSearchChange(value) {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setQ(value);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
  }

  const queryParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      estado: estadoFilter || undefined,
      tecnicoId: tecnicoFilter || undefined,
      page,
      limit: pageSize,
    }),
    [q, estadoFilter, tecnicoFilter, page, pageSize]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ticketQueryKeys.list(queryParams),
    queryFn: () => ticketsApi.listTickets(queryParams),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => ticketsApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.lists() });
    },
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, payload }) => ticketsApi.updateEstado(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.detail(variables.id) });
      // The status drives which WhatsApp template can be sent (and the backend
      // may auto-send `ticket_listo`), so the WhatsApp section must refresh.
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.whatsapp(variables.id) });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, changes }) => ticketsApi.updateTicket(id, changes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.detail(variables.id) });
    },
  });

  return {
    items: data?.items ?? data?.tickets ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    page,
    setPage,
    pageSize,
    searchInput,
    setSearchInput: handleSearchChange,
    estadoFilter,
    setEstadoFilter: (val) => {
      setEstadoFilter(val);
      setPage(1);
    },
    tecnicoFilter,
    setTecnicoFilter: (val) => {
      setTecnicoFilter(val);
      setPage(1);
    },
    isLoading,
    isError,
    error,
    refetch,
    createTicket: createMutation.mutateAsync,
    isCreating: createMutation.isLoading,
    updateEstado: updateEstadoMutation.mutateAsync,
    isUpdatingEstado: updateEstadoMutation.isLoading,
    updateTicket: updateTicketMutation.mutateAsync,
    isUpdating: updateTicketMutation.isLoading,
  };
}
