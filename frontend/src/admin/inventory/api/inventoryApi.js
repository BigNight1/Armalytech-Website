import { httpClient } from '../../shared/api/httpClient.js';

/**
 * Inventory API service (per API contract: `/api/inventory/*`).
 * Components never call `httpClient` directly — only this module and the
 * feature's hooks do.
 */
export const inventoryApi = {
  // Brands
  listBrands: () => httpClient.get('/inventory/brands'),
  createBrand: (name) => httpClient.post('/inventory/brands', { name }),
  updateBrand: (id, name) => httpClient.patch(`/inventory/brands/${id}`, { name }),
  deleteBrand: (id) => httpClient.delete(`/inventory/brands/${id}`),

  // Models (scoped to a brand)
  listModels: (brandId) => httpClient.get(`/inventory/brands/${brandId}/models`),
  createModel: (brandId, name) => httpClient.post(`/inventory/brands/${brandId}/models`, { name }),
  updateModel: (id, name) => httpClient.patch(`/inventory/models/${id}`, { name }),
  deleteModel: (id) => httpClient.delete(`/inventory/models/${id}`),

  // Parts (scoped to a model)
  listParts: (modelId) => httpClient.get(`/inventory/models/${modelId}/parts`),
  createPart: (modelId, part) => httpClient.post(`/inventory/models/${modelId}/parts`, part),
  updatePart: (id, changes) => httpClient.patch(`/inventory/parts/${id}`, changes),
  deletePart: (id) => httpClient.delete(`/inventory/parts/${id}`),
  adjustPartQuantity: (id, delta) => httpClient.post(`/inventory/parts/${id}/adjust`, { delta }),

  // Cross-collection search (brand + model + part name)
  search: (query) => httpClient.get(`/inventory/search?q=${encodeURIComponent(query)}`),
};
