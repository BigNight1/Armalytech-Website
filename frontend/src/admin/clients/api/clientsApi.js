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
 * Clientes API service (per API contract: `/api/community/*`).
 * Components never call `httpClient` directly — only this module and the
 * feature's hooks do.
 */
export const clientsApi = {
  listClients: ({ q, page = 1, limit = 20, consent } = {}) =>
    httpClient.get(`/community/clients${buildQuery({ q, page, limit, consent })}`),

  getClient: (id) => httpClient.get(`/community/clients/${id}`),

  updateClient: (id, changes) => httpClient.patch(`/community/clients/${id}`, changes),

  getClientEvents: (id) => httpClient.get(`/community/clients/${id}/events`),

  /** Ficha 360°'s "Historial de servicios" tab (T-C3): `[{ id, codigo, titulo, estado, equipo, precioTotal, saldo, fechaIngreso }]`. */
  getClientTickets: (id) => httpClient.get(`/community/clients/${id}/tickets`),

  listEvents: ({ from, to, type } = {}) =>
    httpClient.get(`/community/events${buildQuery({ from, to, type })}`),

  registerClientVisit: (id) => httpClient.post(`/community/clients/${id}/visits`),

  registerVisitByPhone: (phone) => httpClient.post('/community/visits', { phone }),

  claimReward: (id) => httpClient.post(`/community/clients/${id}/claim-reward`),

  sendMessage: (id, template) => httpClient.post(`/community/clients/${id}/messages`, { template }),
};
