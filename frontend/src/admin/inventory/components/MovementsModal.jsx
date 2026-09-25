import { Button, Modal, SkeletonRows } from '../../shared/ui/index.js';
import { formatMovementDate } from '../lib/format.js';

const TYPE_LABELS = {
  venta: 'Venta',
  ticket_salida: 'Salida (ticket)',
  ticket_devolucion: 'Devolución',
  ajuste_entrada: 'Entrada',
  ajuste_salida: 'Salida',
};

/** Stock movements (kardex) for one product, newest first. */
export default function MovementsModal({ open, product, movements, isLoading, page, totalPages, onPageChange, onClose }) {
  if (!open || !product) return null;

  return (
    <Modal
      open={open}
      title={`Movimientos — ${product.name}`}
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <SkeletonRows rows={5} columns={1} />
        ) : movements.length === 0 ? (
          <p className="text-sm text-slate-400">Sin movimientos registrados.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 bg-brand-navy-light text-left uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-1.5 pr-2">Fecha</th>
                  <th className="py-1.5 pr-2">Tipo</th>
                  <th className="py-1.5 pr-2">Cantidad</th>
                  <th className="py-1.5 pr-2">Stock después</th>
                  <th className="py-1.5 pr-2">Motivo</th>
                  <th className="py-1.5">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {movements.map((movement) => (
                  <tr key={movement.id} className="text-brand-ink">
                    <td className="whitespace-nowrap py-1.5 pr-2">{formatMovementDate(movement.occurredAt)}</td>
                    <td className="py-1.5 pr-2">{TYPE_LABELS[movement.type] ?? movement.type}</td>
                    <td className={`py-1.5 pr-2 font-semibold ${movement.quantity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {movement.quantity >= 0 ? `+${movement.quantity}` : movement.quantity}
                    </td>
                    <td className="py-1.5 pr-2">{movement.stockAfter}</td>
                    <td className="py-1.5 pr-2 text-slate-400">{movement.reason ?? '—'}</td>
                    <td className="py-1.5 text-slate-400">{movement.userEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-slate-700 px-2 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-slate-700 px-2 py-1 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
