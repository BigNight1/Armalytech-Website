import { inventoryApi } from './inventoryApi.js';
import { inventoryKeys } from './queryKeys.js';

/**
 * Warms the cache for the Inventario section's first query (brands) so the
 * page renders instantly when the user actually clicks the sidebar link
 * (T14: prefetch on hover/focus).
 */
export function prefetchInventory(queryClient) {
  return queryClient.prefetchQuery({
    queryKey: inventoryKeys.brands(),
    queryFn: inventoryApi.listBrands,
  });
}
