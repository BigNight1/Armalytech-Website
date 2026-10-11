import { httpClient } from '../../shared/api/httpClient.js';

/**
 * Ticket cobros API service (per contract, `odd/tasks/modulo-tickets.md`
 * "Fase de corrección y cierre", task C3): cobros are created by the Tickets
 * module (C1) when an advance/balance is collected on a ticket, and land in
 * the Historial as locked rows. This module only reads them for a date range
 * and lets an owner annul one — nothing here edits a cobro's amount/method.
 */
export const cobrosApi = {
  /** Non-deleted cobros for `[from, to]` (`YYYY-MM-DD`, Lima business days). Includes annulled ones. */
  listCobros(from, to) {
    return httpClient.get(`/cobros?from=${from}&to=${to}`);
  },

  /** Owner-only; 409 if already annulled, 403 if the caller isn't owner. */
  anularCobro(id, motivo) {
    return httpClient.post(`/cobros/${id}/anular`, { motivo });
  },
};
