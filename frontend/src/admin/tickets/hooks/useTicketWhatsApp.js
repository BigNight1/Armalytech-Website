import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketQueryKeys } from '../api/queryKeys.js';
import { ticketsApi } from '../api/ticketsApi.js';

/**
 * WhatsApp history + send-window + marketing eligibility for one ticket.
 * Disabled until a ticket id is available (drawer closed / no ticket).
 */
export function useTicketWhatsApp(ticketId) {
  return useQuery({
    queryKey: ticketQueryKeys.whatsapp(ticketId),
    queryFn: () => ticketsApi.getWhatsApp(ticketId),
    enabled: Boolean(ticketId),
    // 503 means the server has no WhatsApp credentials: retrying won't help.
    retry: (failureCount, error) => error?.status !== 503 && failureCount < 1,
  });
}

/**
 * Sends one template message. Resolves with the stored message DTO and
 * refreshes the history so the new row (or the failed attempt the backend
 * also stores) shows up.
 */
export function useSendTicketWhatsApp(ticketId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ template, force }) => ticketsApi.sendWhatsApp(ticketId, { template, force }),
    // Also on error: a rejected send is persisted as `failed` server-side.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.whatsapp(ticketId) });
    },
  });
}
