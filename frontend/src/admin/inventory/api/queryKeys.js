/**
 * TanStack Query key factory for the Inventario feature (T14). Centralized
 * here so hooks, mutations, and the sidebar prefetcher all agree on the same
 * keys (invalidating `brands.all()` must match what `useBrands` queries).
 */
export const inventoryKeys = {
  all: ['inventory'],
  brands: () => [...inventoryKeys.all, 'brands'],
  models: (brandId) => [...inventoryKeys.all, 'models', brandId],
  parts: (modelId) => [...inventoryKeys.all, 'parts', modelId],
  search: (query) => [...inventoryKeys.all, 'search', query],
};
