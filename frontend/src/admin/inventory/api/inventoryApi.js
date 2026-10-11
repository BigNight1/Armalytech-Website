import { httpClient } from '../../shared/api/httpClient.js';

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * Inventory v2 API service (per API contract: `/api/inventory/*`).
 * Components never call `httpClient` directly — only this module and the
 * feature's hooks do.
 */
export const inventoryApi = {
  // Categories
  listCategories: () => httpClient.get('/inventory/categories'),
  createCategory: (name) => httpClient.post('/inventory/categories', { name }),
  updateCategory: (id, name) => httpClient.patch(`/inventory/categories/${id}`, { name }),
  deleteCategory: (id) => httpClient.delete(`/inventory/categories/${id}`),

  // Brands
  listBrands: () => httpClient.get('/inventory/brands'),
  createBrand: (name) => httpClient.post('/inventory/brands', { name }),
  updateBrand: (id, name) => httpClient.patch(`/inventory/brands/${id}`, { name }),
  deleteBrand: (id) => httpClient.delete(`/inventory/brands/${id}`),

  // Phones (compatibility catalog — was "models" pre-v2)
  listPhones: ({ brandId } = {}) => httpClient.get(`/inventory/phones${buildQuery({ brandId })}`),
  createPhone: (brandId, name) => httpClient.post('/inventory/phones', { brandId, name }),
  updatePhone: (id, changes) => httpClient.patch(`/inventory/phones/${id}`, changes),
  deletePhone: (id) => httpClient.delete(`/inventory/phones/${id}`),

  // Products
  listProducts: (params) => httpClient.get(`/inventory/products${buildQuery(params)}`),
  getProduct: (id) => httpClient.get(`/inventory/products/${id}`),
  createProduct: (payload) => httpClient.post('/inventory/products', payload),
  updateProduct: (id, changes) => httpClient.patch(`/inventory/products/${id}`, changes),
  archiveProduct: (id) => httpClient.delete(`/inventory/products/${id}`),
  restoreProduct: (id) => httpClient.post(`/inventory/products/${id}/restore`),
  adjustProductStock: (id, { delta, reason }) =>
    httpClient.post(`/inventory/products/${id}/adjust`, { delta, reason }),
  listProductMovements: (id, { page, limit } = {}) =>
    httpClient.get(`/inventory/products/${id}/movements${buildQuery({ page, limit })}`),
};
