/**
 * Dev-only fixtures for `?demo=<estado>` preview (TicketPage, guarded by
 * `import.meta.env.DEV`). One entry per ADR 0007 state so every hero
 * tone/step combination can be compared against the design board without a
 * backend. Never imported outside DEV code paths — see TicketPage.jsx.
 */
const BASE = {
  codigo: 'AT-000148',
  cliente: { nombre: 'Andrea', apellido: 'Salazar' },
  equipo: { marca: 'Apple', celular: 'iPhone 12', color: 'Negro' },
  titulo: 'Cambio de pantalla',
  precioTotal: 189,
  adelanto: 0,
  fechaIngreso: '2026-09-08T10:24:00-05:00',
  entregaEstimada: '2026-09-10T18:00:00-05:00',
};

const HISTORIAL_BY_ESTADO = {
  pendiente: [{ estado: 'pendiente', fecha: BASE.fechaIngreso }],
  aprobado: [
    { estado: 'pendiente', fecha: BASE.fechaIngreso },
    { estado: 'aprobado', fecha: '2026-09-08T15:40:00-05:00' },
  ],
  trabajando: [
    { estado: 'pendiente', fecha: BASE.fechaIngreso },
    { estado: 'aprobado', fecha: '2026-09-08T15:40:00-05:00' },
    { estado: 'trabajando', fecha: '2026-09-09T09:10:00-05:00' },
  ],
  listo: [
    { estado: 'pendiente', fecha: BASE.fechaIngreso },
    { estado: 'aprobado', fecha: '2026-09-08T15:40:00-05:00' },
    { estado: 'trabajando', fecha: '2026-09-09T09:10:00-05:00' },
    { estado: 'listo', fecha: '2026-09-09T16:35:00-05:00' },
  ],
  entregado: [
    { estado: 'pendiente', fecha: BASE.fechaIngreso },
    { estado: 'aprobado', fecha: '2026-09-08T15:40:00-05:00' },
    { estado: 'trabajando', fecha: '2026-09-09T09:10:00-05:00' },
    { estado: 'listo', fecha: '2026-09-09T16:35:00-05:00' },
    { estado: 'entregado', fecha: '2026-09-10T12:05:00-05:00' },
  ],
  cancelado: [
    { estado: 'pendiente', fecha: BASE.fechaIngreso },
    { estado: 'cancelado', fecha: '2026-09-09T11:00:00-05:00' },
  ],
  abandonado: [{ estado: 'pendiente', fecha: BASE.fechaIngreso }],
};

const ADELANTO_BY_ESTADO = {
  aprobado: 50,
  trabajando: 50,
  listo: 50,
  entregado: 50,
};

/** Returns a demo ticket DTO for `estado`, or `null` for an unknown value. */
export function getDemoTicket(estado) {
  if (!(estado in HISTORIAL_BY_ESTADO)) return null;
  return {
    ...BASE,
    estado,
    adelanto: ADELANTO_BY_ESTADO[estado] ?? 0,
    historialEstados: HISTORIAL_BY_ESTADO[estado],
  };
}

export const DEMO_ESTADOS = Object.keys(HISTORIAL_BY_ESTADO);
