import { fechaDeEstado, formatFecha, formatSoles } from './format.js';

/**
 * Maps ADR 0007's 7 states onto the design's 3-step tracker + hero styling.
 *
 * Design source: `/ticket/AT-2X9K4M` board — 3 states (pendiente/trabajando/
 * finalizado), each with its own hero color, title, subtitle and tag.
 *
 * User decision (overrides the design's own 3-state/`AT-2X9K4M` demo props):
 * real states are pendiente, aprobado, trabajando, listo, entregado,
 * cancelado, abandonado (ADR 0007, 2026-09-25 update). The main path
 * (pendiente → aprobado → trabajando → listo → entregado) is grouped onto
 * the design's 3 tracker columns; `cancelado`/`abandonado` skip the tracker
 * and get their own banner instead (see TicketClosedBanner).
 */
const GROUP_OF_ESTADO = {
  pendiente: 0,
  aprobado: 0,
  trabajando: 1,
  listo: 2,
  entregado: 2,
};

const HERO_COPY = {
  pendiente: {
    titulo: 'Recibimos tu equipo.',
    subtitulo: 'Está registrado y en cola de diagnóstico. Te avisamos apenas un técnico lo tome.',
    etiqueta: 'Pendiente',
    tone: 'neutral',
  },
  aprobado: {
    titulo: 'Aprobaste el presupuesto.',
    subtitulo: 'Tu equipo pasó a la cola de reparación. Te avisamos apenas un técnico lo tome.',
    etiqueta: 'Aprobado',
    tone: 'neutral',
  },
  trabajando: {
    titulo: 'Tu equipo está en reparación.',
    subtitulo: 'Un técnico está trabajando en tu equipo. Esta página se actualiza sola.',
    etiqueta: 'Trabajando',
    tone: 'accent',
  },
  listo: {
    titulo: 'Tu equipo está listo.',
    subtitulo: 'Reparación terminada y probada. Puedes recogerlo en tienda cuando quieras.',
    etiqueta: 'Listo para recoger',
    tone: 'dark',
  },
  entregado: {
    titulo: 'Equipo entregado.',
    subtitulo: 'Retiraste tu equipo. Gracias por confiar en ArmalyTech.',
    etiqueta: 'Entregado',
    tone: 'dark',
  },
  cancelado: {
    titulo: 'Ticket cancelado.',
    subtitulo: 'Este ticket fue cancelado y no sigue en proceso. Si tienes dudas, contáctanos por WhatsApp.',
    etiqueta: 'Cancelado',
    tone: 'danger',
  },
  abandonado: {
    titulo: 'Ticket sin actividad.',
    subtitulo: 'No hubo cambios en los últimos días. Escríbenos por WhatsApp si quieres retomar la reparación.',
    etiqueta: 'Sin actividad',
    tone: 'muted',
  },
};

const TONE_STYLES = {
  neutral: { background: 'var(--tk-surface)', color: 'var(--tk-text)' },
  accent: { background: 'var(--tk-accent-500)', color: 'var(--tk-on-accent)' },
  dark: { background: '#0f172a', color: '#fff' },
  danger: { background: 'var(--tk-danger-bg)', color: 'var(--tk-danger-ink)' },
  muted: { background: 'var(--tk-surface)', color: 'var(--tk-muted)' },
};

const DOT_COLOR = {
  neutral: '#64748b',
  accent: '#f97316',
  dark: '#0f172a',
  danger: 'var(--tk-danger)',
  muted: '#94a3b8',
};

const STEP_DEFS = [
  {
    titulo: 'Pendiente',
    desc: 'Equipo recibido, registrado y guardado con tu ticket. En cola de diagnóstico y aprobación de presupuesto.',
    icono: '/trabajamos/primero.svg',
  },
  {
    titulo: 'Trabajando',
    desc: 'El técnico está reparando tu equipo. Esta página se actualiza sola cuando cambia de estado.',
    icono: '/trabajamos/segundo.svg',
  },
  {
    titulo: 'Listo',
    desc: 'Reparación probada y lista para recoger en tienda.',
    icono: '/trabajamos/tercero.svg',
  },
];

function buildSteps(ticket) {
  const { estado, historialEstados, fechaIngreso } = ticket;
  const group = GROUP_OF_ESTADO[estado] ?? 0;

  const marcaFor = (index) => {
    if (index === 0) {
      return formatFecha(fechaIngreso) ?? 'En curso';
    }
    if (index === 1) {
      if (group > 1) return formatFecha(fechaDeEstado(historialEstados, 'trabajando')) ?? 'Completado';
      if (group === 1) return 'En curso';
      return 'En espera';
    }
    // index === 2
    if (estado === 'entregado') return formatFecha(fechaDeEstado(historialEstados, 'entregado')) ?? 'Entregado';
    if (estado === 'listo') return formatFecha(fechaDeEstado(historialEstados, 'listo')) ?? 'En curso';
    return 'En espera';
  };

  return STEP_DEFS.map((def, index) => {
    const done = index < group || (index === 2 && estado === 'entregado');
    const active = index === group && !done;
    return {
      ...def,
      numero: `0${index + 1}`,
      marca: marcaFor(index),
      done,
      active,
      on: done || active,
    };
  });
}

function buildInfoCells(ticket) {
  const { cliente, equipo, titulo, fechaIngreso, entregaEstimada, precioTotal, adelanto, estado, historialEstados } =
    ticket;

  const nombreCliente = [cliente?.nombre, cliente?.apellido].filter(Boolean).join(' ').trim() || '—';
  const equipoTexto =
    [equipo?.marca, equipo?.celular].filter(Boolean).join(' ') + (equipo?.color ? ` · ${equipo.color}` : '');

  let entregaLabel = 'Entrega estimada';
  let entregaValor = formatFecha(entregaEstimada) ?? 'Por confirmar';
  if (estado === 'listo') {
    entregaLabel = 'Listo desde';
    entregaValor = formatFecha(fechaDeEstado(historialEstados, 'listo')) ?? entregaValor;
  } else if (estado === 'entregado') {
    entregaLabel = 'Entregado el';
    entregaValor = formatFecha(fechaDeEstado(historialEstados, 'entregado')) ?? entregaValor;
  } else if (estado === 'cancelado') {
    entregaLabel = 'Cancelado el';
    entregaValor = formatFecha(fechaDeEstado(historialEstados, 'cancelado')) ?? '—';
  } else if (estado === 'abandonado') {
    entregaLabel = 'Sin cambios desde';
    const last = Array.isArray(historialEstados) && historialEstados.length > 0
      ? historialEstados[historialEstados.length - 1].fecha
      : fechaIngreso;
    entregaValor = formatFecha(last) ?? '—';
  }

  const costoValor =
    adelanto > 0 ? `${formatSoles(precioTotal)} (adelanto ${formatSoles(adelanto)})` : formatSoles(precioTotal);

  return [
    { label: 'Cliente', value: nombreCliente },
    { label: 'Equipo', value: equipoTexto || '—' },
    { label: 'Servicio', value: titulo || '—' },
    { label: 'Ingreso', value: formatFecha(fechaIngreso) ?? '—' },
    { label: entregaLabel, value: entregaValor, accent: estado !== 'pendiente' },
    { label: 'Costo acordado', value: costoValor },
  ];
}

/**
 * Derives every view-model value TicketView/TicketSteps need from a raw
 * ticket DTO (see `api/ticketApi.js` for the shape). Kept as one pure
 * function so hero copy, tracker steps and info cells stay consistent for a
 * given `estado` instead of being computed ad hoc per component.
 */
export function presentTicket(ticket) {
  const estado = ticket?.estado ?? 'pendiente';
  const heroCopy = HERO_COPY[estado] ?? HERO_COPY.pendiente;
  const showSteps = estado in GROUP_OF_ESTADO;

  return {
    estado,
    codigo: ticket?.codigo ?? '',
    heroCopy,
    heroStyle: TONE_STYLES[heroCopy.tone],
    dotColor: DOT_COLOR[heroCopy.tone],
    dotPulse: heroCopy.tone === 'accent',
    showSteps,
    showClosedBanner: !showSteps,
    steps: showSteps ? buildSteps(ticket) : [],
    info: buildInfoCells(ticket),
  };
}
