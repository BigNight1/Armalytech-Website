// Reuses the admin panel's shared httpClient (same fetch wrapper, JSON
// envelope unwrap, ApiError) instead of duplicating a fetch helper — same
// choice made by `community/api/communityApi.js` for the other public,
// session-less page.
import { httpClient } from '../../admin/shared/api/httpClient.js';

/**
 * Public ticket lookup API (`/api/tickets/public/:token`).
 *
 * BACKEND CONTRACT (assumed — the `tickets` backend module does not exist
 * yet, see odd/tasks/rediseno-panel.md R3). Documented here so the backend
 * implementer has a concrete target and so this page's fixture
 * (`../fixtures/demoTicket.js`) mirrors the real shape.
 *
 * GET /api/tickets/public/:token
 *   200 { ok: true, data: {
 *     codigo: string,              // "AT-000148" (ADR 0006 `codigo`, not the publicToken)
 *     estado: 'pendiente' | 'aprobado' | 'trabajando' | 'listo' | 'entregado'
 *           | 'cancelado' | 'abandonado',               // ADR 0007 (2026-09-25 update)
 *     cliente: { nombre: string, apellido: string },
 *     equipo: { marca: string, celular: string, color?: string },
 *     titulo: string,              // customer-facing service title, e.g. "Cambio de pantalla"
 *     precioTotal: number,         // agreed price shown to the customer (never costoUnitario/margin)
 *     adelanto: number,            // 0 when none
 *     fechaIngreso: string,        // ISO date — ticket `fechas.creacion`
 *     entregaEstimada?: string,    // ISO date — only meaningful before `listo`
 *     historialEstados: Array<{ estado: string, fecha: string }>, // ADR 0006 `historialEstados`,
 *                                   // used to read the date each step was reached
 *   } }
 *   404 { ok: false, error: { code: 'not_found', message: string } }
 *     — unknown/invalid publicToken. This is the response every real visit
 *       gets today since the backend module doesn't exist; the UI treats any
 *       request failure (404, network, 5xx) as "not found" (see TicketPage).
 *
 * Never returned: technician-only fields (piezas.costoUnitario, notas,
 * tecnicoId, unlock code/patrón) — those stay out of the public DTO by
 * backend contract, not just hidden client-side.
 */
export const ticketApi = {
  getPublicTicket: (token) =>
    httpClient.get(`/tickets/public/${encodeURIComponent(token)}`, {
      skipUnauthorizedHandler: true,
    }),

  lookupPublicTicket: ({ codigo, telefono }) =>
    httpClient.post(
      '/tickets/public/lookup',
      { codigo, telefono },
      { skipUnauthorizedHandler: true },
    ),
};
