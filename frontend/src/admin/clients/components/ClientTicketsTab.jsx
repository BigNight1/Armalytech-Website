import { Spinner } from '../../shared/ui/index.js';
import TicketStatusBadge from '../../tickets/components/TicketStatusBadge.jsx';
import { formatPen } from '../../shared/lib/money.js';
import { formatLimaShort } from '../lib/format.js';

/**
 * Ficha 360°'s "Historial de servicios" tab (design: `Tickets.dc.html`,
 * board "Detalle del cliente · pestaña Historial de servicios") — a
 * client's repair tickets, each row navigating to its ticket detail.
 * `onSelectTicket` receives the raw ticket so the container decides how to
 * open it (see `ClientsPage`/`ClientDetailModal` — Tickets' own drawer
 * currently only opens from `/admin/tickets`, so this navigates there with
 * `?ticket=<id>`, a query param the Tickets page doesn't read yet).
 */
export default function ClientTicketsTab({ tickets, isLoading, onSelectTicket }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (tickets.length === 0) {
    return <p className="text-[15px] text-muted">Este cliente aún no registra órdenes de reparación en taller.</p>;
  }

  return (
    <>
      <div className="flex flex-col border-t-2 border-ink">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            onClick={() => onSelectTicket(ticket)}
            className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-b border-line py-3.5 text-left text-ink transition-colors hover:bg-row-hover"
          >
            <span className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[15px] font-bold">{ticket.codigo}</span>
              <TicketStatusBadge estado={ticket.estado} />
            </span>
            <span className="text-right text-[17px] font-extrabold tabular-nums">
              {formatPen(ticket.precioTotal || 0)}
            </span>
            <span className="text-[15px]">
              <strong>{ticket.titulo}</strong> {ticket.equipo && <span className="text-muted">· {ticket.equipo}</span>}
            </span>
            <span className="whitespace-nowrap text-right text-sm text-muted">
              {formatLimaShort(ticket.fechaIngreso)}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3.5 text-sm text-muted">Toca un ticket para abrir su detalle.</p>
    </>
  );
}
