/**
 * TanStack Query key factory for the Inventario v2 feature. Centralized
 * here so hooks, mutations, and the sidebar prefetcher all agree on the
 * same keys.
 */
export const inventoryKeys = {
  all: ['inventory'],
  categories: () => [...inventoryKeys.all, 'categories'],
  brands: () => [...inventoryKeys.all, 'brands'],
  phones: () => [...inventoryKeys.all, 'phones'],
  products: (params) => [...inventoryKeys.all, 'products', params],
  movements: (productId, params) => [...inventoryKeys.all, 'movements', productId, params],
};

/** Products page size shared by `useProducts` and the sidebar prefetch. */
export const PRODUCTS_PAGE_SIZE = 20;
