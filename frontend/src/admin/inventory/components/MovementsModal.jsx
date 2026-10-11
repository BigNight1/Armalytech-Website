import { Button, Modal, SkeletonRows } from '../../shared/ui/index.js';
import { formatMovementDate } from '../lib/format.js';

const TYPE_LABELS = {
  venta: 'Venta',
  ticket_salida: 'Salida (ticket)',
  ticket_devolucion: 'Devolución',
  ajuste_entrada: 'Entrada',
  ajuste_salida: 'Salida',
};

/**
 * Stock movements (kardex) for one product, newest first. Rendered via the
 * shared `Modal` as a wide (820px) centered dialog (`bordered`, `size="xl"`)
 * matching the design (`mov` panel, closeMov).
 */
export default function MovementsModal({ open, product, movements, isLoading, page, totalPages, onPageChange, onClose }) {
  return (
    <Modal
      open={open && Boolean(product)}
      bordered
      size="xl"
      title={product ? `Movimientos — ${product.name}` : 'Movimientos'}
      header={
        product && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">Movimientos · kardex</span>
            <h2 className="text-2xl">
              {product.name}
              {product.model ? ` · ${product.model}` : ''}
            </h2>
          </div>
        )
      }
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <SkeletonRows rows={5} columns={6} />
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted">Sin movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Stock después</th>
                  <th>Motivo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap">{formatMovementDate(movement.occurredAt)}</td>
                    <td className="font-semibold">{TYPE_LABELS[movement.type] ?? movement.type}</td>
                    <td className={`text-right font-extrabold tabular-nums ${movement.quantity >= 0 ? 'text-accent-ink' : 'text-danger-ink'}`}>
                      {movement.quantity >= 0 ? `+${movement.quantity}` : movement.quantity}
                    </td>
                    <td className="text-right tabular-nums">{movement.stockAfter}</td>
                    <td className="text-muted">{movement.reason ?? '—'}</td>
                    <td className="text-muted">{movement.userEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm text-muted">
            <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Anterior
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
