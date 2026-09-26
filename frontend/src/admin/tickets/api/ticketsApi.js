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
 * Service to interact with the backend Tickets and Technicians API.
 */
export const ticketsApi = {
  // Tickets
  listTickets: (params = {}) => httpClient.get(`/tickets${buildQuery(params)}`),

  getTicket: (id) => httpClient.get(`/tickets/${id}`),

  createTicket: (payload) => httpClient.post('/tickets', payload),

  // `PATCH /:id/status` per contract (the old `/estado` route is a
  // duplicate C1 is removing) — kept as `updateEstado` here so
  // `hooks/useTickets.js` and callers don't need to change.
  updateEstado: (id, payload) => httpClient.patch(`/tickets/${id}/status`, payload),

  updatePiezas: (id, piezas) => httpClient.patch(`/tickets/${id}/piezas`, { piezas }),

  updateTicket: (id, changes) => httpClient.patch(`/tickets/${id}`, changes),

  // Audited per call (logs `{ usuarioId, usuarioEmail, fecha }`), so this
  // is a POST, not a cached GET — call it every time "Mostrar" is clicked.
  revealClave: (id) => httpClient.post(`/tickets/${id}/reveal-clave`),

  addNota: (id, nota) => httpClient.post(`/tickets/${id}/notas`, { nota }),

  getAvailability: ({ categoriaId, celularId, excludeTicketId, q, categoria } = {}) =>
    httpClient.get(`/tickets/availability${buildQuery({ categoriaId, celularId, excludeTicketId, q, categoria })}`),

  resolvePhone: ({ marca, modelo }) =>
    httpClient.post('/inventory/phones/resolve', { marca, modelo }),

  // Technicians
  listTechnicians: () => httpClient.get('/technicians'),

  createTechnician: (payload) => httpClient.post('/technicians', payload),

  updateTechnician: (id, changes) => httpClient.patch(`/technicians/${id}`, changes),
};
