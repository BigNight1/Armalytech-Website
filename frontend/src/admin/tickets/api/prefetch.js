import { ticketQueryKeys } from './queryKeys.js';
import { ticketsApi } from './ticketsApi.js';

export function prefetchTickets(queryClient) {
  return queryClient.prefetchQuery({
    queryKey: ticketQueryKeys.list({ page: 1, limit: 20 }),
    queryFn: () => ticketsApi.listTickets({ page: 1, limit: 20 }),
    staleTime: 30 * 1000,
  });
}

export function prefetchTechnicians(queryClient) {
  return queryClient.prefetchQuery({
    queryKey: ticketQueryKeys.technicians,
    queryFn: () => ticketsApi.listTechnicians(),
    staleTime: 5 * 60 * 1000,
  });
}
