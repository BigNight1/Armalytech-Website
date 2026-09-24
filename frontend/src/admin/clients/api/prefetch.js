import { clientsApi } from './clientsApi.js';
import { clientsKeys } from './queryKeys.js';

const DEFAULT_PARAMS = { q: '', page: 1, limit: 20, consent: undefined };

/**
 * Warms the cache for the Clientes section's first query (the default,
 * unfiltered client list) so the page renders instantly once the user
 * clicks the sidebar link (T14: prefetch on hover/focus).
 */
export function prefetchClients(queryClient) {
  return queryClient.prefetchQuery({
    queryKey: clientsKeys.list(DEFAULT_PARAMS),
    queryFn: () => clientsApi.listClients(DEFAULT_PARAMS),
  });
}
