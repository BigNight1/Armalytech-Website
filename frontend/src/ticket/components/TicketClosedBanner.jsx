/**
 * Replaces the 3-step tracker for `cancelado`/`abandonado` (user decision,
 * see lib/ticketPresenter.js) — these states aren't points on the repair
 * timeline, so a clear explanatory banner reads better than a tracker stuck
 * mid-way or showing a 4th/5th column the design never defined.
 */
export default function TicketClosedBanner({ estado }) {
  const isCancelado = estado === 'cancelado';
  const message = isCancelado
    ? 'Este ticket ya no sigue en proceso. Si crees que esto es un error o quieres volver a traer tu equipo, escríbenos por WhatsApp con tu código de ticket.'
    : 'No hubo cambios en este ticket durante varios días, así que lo marcamos como sin actividad. Sigue guardado: escríbenos por WhatsApp si quieres retomar la reparación.';

  return (
    <section
      className="flex flex-col sm:flex-row items-start gap-4 border-t-2 border-[var(--tk-text)] p-6 md:p-7"
      style={isCancelado ? { background: 'var(--tk-danger-bg)' } : { background: 'var(--tk-surface)' }}
    >
      <span
        className="text-xs font-extrabold uppercase tracking-[0.12em] px-2.5 py-1.5 shrink-0"
        style={
          isCancelado
            ? { background: 'var(--tk-danger)', color: '#fff' }
            : { border: '1px solid var(--tk-divider)', color: 'var(--tk-muted)' }
        }
      >
        {isCancelado ? 'Cancelado' : 'Sin actividad'}
      </span>
      <p
        className="text-base leading-relaxed"
        style={isCancelado ? { color: 'var(--tk-danger-ink)' } : { color: 'var(--tk-muted)' }}
      >
        {message}
      </p>
    </section>
  );
}
