import { request, type APIRequestContext } from '@playwright/test';
import { AUTH_STATE_PATH, SITE_URL } from './env';

/**
 * Arrange helpers.
 *
 * The specs drive the browser for the *behaviour under test* and use the REST
 * API only to set up state (a ticket that already exists). Seeding goes
 * through the site origin (`SITE_URL`, not the backend port) so the
 * dev-server proxy and the session cookie path are exercised too.
 *
 * `apiAsOwner()` reuses the cookie `global-setup.ts` captured instead of
 * logging in again: `POST /api/auth/login` is throttled at 5/min.
 */

export interface SeededTicket {
  id: string;
  codigo: string;
  publicToken: string;
}

export interface NewTicketInput {
  nombre: string;
  apellido: string;
  telefono: string;
  marca: string;
  modelo: string;
  falla: string;
  titulo: string;
  precioTotal: number;
  adelanto?: number;
  notaCliente?: string;
}

export const DEFAULT_TICKET: NewTicketInput = {
  nombre: 'Lucía',
  apellido: 'Ramírez',
  telefono: '987654321',
  marca: 'Samsung',
  modelo: 'Galaxy A53',
  falla: 'Pantalla rota, el táctil no responde en la mitad inferior.',
  titulo: 'Cambio de pantalla Galaxy A53',
  precioTotal: 320,
  adelanto: 100,
  notaCliente: 'Te escribimos por WhatsApp en cuanto esté listo.',
};

/** API context already authenticated as the owner (cookie from global-setup). */
export async function apiAsOwner(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: SITE_URL, storageState: AUTH_STATE_PATH });
}

/** Creates a ticket through `POST /api/tickets`, exactly as the admin panel does. */
export async function createTicket(
  api: APIRequestContext,
  overrides: Partial<NewTicketInput> = {},
): Promise<SeededTicket> {
  const input: NewTicketInput = { ...DEFAULT_TICKET, ...overrides };
  const res = await api.post('/api/tickets', {
    data: {
      cliente: {
        nombre: input.nombre,
        apellido: input.apellido,
        telefono: input.telefono,
      },
      equipo: {
        marca: input.marca,
        modelo: input.modelo,
        color: 'Negro',
        fallaReportada: input.falla,
      },
      titulo: input.titulo,
      notaCliente: input.notaCliente,
      precioTotal: input.precioTotal,
      ...(input.adelanto
        ? { adelanto: input.adelanto, metodoAdelanto: 'yape' as const }
        : {}),
    },
  });

  if (!res.ok()) {
    throw new Error(`No se pudo crear el ticket (HTTP ${res.status()}): ${await res.text()}`);
  }

  const body = (await res.json()) as Record<string, unknown>;
  const ticket = (body.ticket ?? body) as Record<string, unknown>;
  const codigo = ticket.codigo as string | undefined;
  const publicToken = ticket.publicToken as string | undefined;
  const id = (ticket.id ?? ticket._id) as string | undefined;

  if (!codigo || !publicToken || !id) {
    throw new Error(`Respuesta inesperada de POST /api/tickets: ${JSON.stringify(body)}`);
  }

  return { id, codigo, publicToken };
}

/** Moves a ticket to another state through `PATCH /api/tickets/:id/status`. */
export async function patchEstado(
  api: APIRequestContext,
  ticketId: string,
  nuevoEstado: string,
): Promise<void> {
  const res = await api.patch(`/api/tickets/${ticketId}/status`, {
    data: { nuevoEstado },
  });
  if (!res.ok()) {
    throw new Error(
      `No se pudo pasar el ticket a "${nuevoEstado}" (HTTP ${res.status()}): ${await res.text()}`,
    );
  }
}
