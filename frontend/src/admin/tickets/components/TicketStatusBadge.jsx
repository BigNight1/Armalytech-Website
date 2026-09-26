export const TICKET_ESTADO_CONFIG = {
  pendiente: {
    label: 'Pendiente',
    className: 'border border-line text-muted',
  },
  presupuestado: {
    label: 'Presupuestado',
    className: 'border border-line text-ink',
  },
  aprobado: {
    label: 'Aprobado',
    className: 'bg-accent-100 text-accent-900 font-bold',
  },
  trabajando: {
    label: 'En taller',
    className: 'bg-accent text-on-accent font-bold',
  },
  listo: {
    label: 'Listo',
    className: 'border border-accent text-accent-ink font-extrabold',
  },
  entregado: {
    label: 'Entregado',
    className: 'border border-line text-muted',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-danger-bg text-danger-ink font-bold',
  },
  abandonado: {
    label: 'Abandonado',
    className: 'bg-danger-bg text-danger-ink font-bold',
  },
};

export default function TicketStatusBadge({ estado, className = '' }) {
  const config = TICKET_ESTADO_CONFIG[estado] || {
    label: estado,
    className: 'border border-line text-muted',
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
