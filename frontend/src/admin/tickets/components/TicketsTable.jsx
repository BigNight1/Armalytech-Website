import { ChevronRight } from 'lucide-react';
import TicketStatusBadge from './TicketStatusBadge.jsx';
import { formatLimaShort } from '../../shared/lib/time.js';
import { formatPEN } from '../../shared/lib/money.js';

export default function TicketsTable({ tickets, onSelectTicket }) {
  if (!tickets || tickets.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto border-t-2 border-ink">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Celular</th>
            <th>Equipo</th>
            <th>Estado</th>
            <th className="text-right">Total</th>
            <th className="text-right">Saldo</th>
            <th>Ingreso</th>
            <th className="text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const clienteName = t.cliente?.nombre
              ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim()
              : 'Cliente sin nombre';
            const saldo =
              t.estado === 'entregado'
                ? 0
                : t.saldo !== undefined
                  ? t.saldo
                  : Math.max(0, (t.precioTotal || 0) - (t.adelanto || 0));

            return (
              <tr
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className="cursor-pointer"
              >
                <td className="font-bold text-accent-ink font-mono">{t.codigo}</td>
                <td className="font-bold text-ink">{clienteName}</td>
                <td className="whitespace-nowrap tabular-nums text-muted">
                  {(t.cliente?.telefono || t.cliente?.celular) ? `+51 ${t.cliente.telefono || t.cliente.celular}` : '—'}
                </td>
                <td>
                  <span className="font-semibold text-ink">
                    {t.equipo?.marca} {t.equipo?.modelo || t.equipo?.celular}
                  </span>
                  {t.titulo && (
                    <span className="block text-xs text-muted truncate max-w-[200px]">
                      {t.titulo}
                    </span>
                  )}
                </td>
                <td>
                  <TicketStatusBadge estado={t.estado} />
                </td>
                <td className="text-right font-bold tabular-nums text-ink">
                  {formatPEN(t.precioTotal || 0)}
                </td>
                <td className="text-right font-bold tabular-nums">
                  {saldo > 0 ? (
                    <span className="text-accent-ink">{formatPEN(saldo)}</span>
                  ) : (
                    <span className="text-muted font-normal">Saldado</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-muted text-sm">
                  {formatLimaShort(t.fechas?.creacion || t.createdAt)}
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(t);
                    }}
                    className="inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap border border-line px-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent-ink"
                    title="Ver detalle"
                  >
                    <span>Ver</span>
                    <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
