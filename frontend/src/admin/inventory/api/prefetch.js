import { inventoryApi } from './inventoryApi.js';
import { inventoryKeys, PRODUCTS_PAGE_SIZE } from './queryKeys.js';

const DEFAULT_PRODUCTS_PARAMS = {
  q: undefined,
  categoryId: undefined,
  lowStock: undefined,
  includeArchived: undefined,
  page: 1,
  limit: PRODUCTS_PAGE_SIZE,
};

/**
 * Warms the cache for the Inventario section's first queries (categories,
 * for the filter chips, and the default unfiltered products page) so the
 * page renders instantly once the user clicks the sidebar link.
 */
export function prefetchInventory(queryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.categories(),
      queryFn: inventoryApi.listCategories,
    }),
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.products(DEFAULT_PRODUCTS_PARAMS),
      queryFn: () => inventoryApi.listProducts(DEFAULT_PRODUCTS_PARAMS),
    }),
  ]);
}
