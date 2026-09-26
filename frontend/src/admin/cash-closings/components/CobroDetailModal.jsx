import { ShoppingBag, Wrench, Calendar, CreditCard, Ban } from 'lucide-react';
import { Button, Modal } from '../../shared/ui/index.js';
import { formatPEN } from '../../shared/lib/money.js';
import { cobroTipoLabel } from '../lib/cobroRows.js';

export default function CobroDetailModal({
  cobro,
  isOwner = false,
  onClose,
  onAnularRequest,
}) {
  if (!cobro) return null;

  const isVenta = cobro.tipo === 'venta';
  const isAnulado = cobro.anulado;

  const formattedDate = cobro.fecha
    ? new Date(cobro.fecha).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  return (
    <Modal
      open={Boolean(cobro)}
      onClose={onClose}
      title={isVenta ? `Venta ${cobro.codigo}` : `Cobro ${cobro.codigo}`}
      size="md"
      bordered
      header={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                isVenta
                  ? 'bg-accent/15 text-accent-ink border border-accent/30'
                  : 'bg-surface text-ink border border-line'
              }`}
            >
              {isVenta ? <ShoppingBag size={13} /> : <Wrench size={13} />}
              {cobroTipoLabel(cobro.tipo)}
            </span>
            {isAnulado ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-danger-bg text-danger-ink border border-danger/30">
                <Ban size={12} />
                Anulado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Registrado
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-ink">
            {isVenta ? `Comprobante de Venta · ${cobro.codigo}` : `Ticket de Servicio · ${cobro.codigo}`}
          </h2>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            {isOwner && !isAnulado && onAnularRequest && (
              <Button
                variant="ghost"
                className="text-danger-ink hover:bg-danger-bg border border-danger/30"
                onClick={() => {
                  onClose();
                  onAnularRequest(cobro);
                }}
              >
                <Ban size={15} />
                <span>Anular {isVenta ? 'venta' : 'cobro'}</span>
              </Button>
            )}
          </div>
          <Button variant="primary" onClick={onClose}>
            Entendido
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Info banner / meta */}
        <div className="grid grid-cols-2 gap-3 rounded-none border border-line bg-surface p-3.5 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Calendar size={13} />
              Fecha y hora
            </span>
            <span className="text-sm font-semibold text-ink">{formattedDate}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <CreditCard size={13} />
              Método de pago
            </span>
            <span className="text-sm font-semibold capitalize text-ink">
              {cobro.metodo === 'yape' ? 'Yape' : 'Efectivo'}
            </span>
          </div>

          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <span className="text-xs font-medium text-muted">Total cobrado</span>
            <span className="text-base font-bold text-accent-ink">
              {formatPEN(cobro.monto)}
            </span>
          </div>
        </div>

        {/* Anulado notice */}
        {isAnulado && (
          <div className="flex flex-col gap-1.5 border-l-4 border-danger bg-danger-bg p-3.5 text-sm text-danger-ink">
            <span className="font-bold">Esta transacción fue anulada</span>
            {cobro.motivoAnulacion && (
              <p className="text-xs leading-relaxed">
                <strong>Motivo:</strong> {cobro.motivoAnulacion}
              </p>
            )}
            {cobro.anuladoPor && (
              <span className="text-[11px] opacity-80">
                Por {cobro.anuladoPor} el{' '}
                {cobro.anuladoAt
                  ? new Date(cobro.anuladoAt).toLocaleString('es-PE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : '—'}
              </span>
            )}
          </div>
        )}

        {/* Productos vendidos (si es venta) */}
        {isVenta && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Productos entregados ({cobro.items?.length ?? 0})
              </h3>
            </div>

            {cobro.items && cobro.items.length > 0 ? (
              <div className="overflow-hidden border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-surface text-xs font-semibold text-muted">
                    <tr>
                      <th className="px-3.5 py-2">Producto</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-right">P. Unit.</th>
                      <th className="px-3.5 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {cobro.items.map((item, idx) => {
                      const subtotal = (item.precioUnitario ?? 0) * (item.cantidad ?? 1);
                      return (
                        <tr key={item.productoId || idx} className="hover:bg-surface/50">
                          <td className="px-3.5 py-2.5 font-medium text-ink">
                            {item.nombre}
                          </td>
                          <td className="px-3 py-2.5 text-center text-muted font-mono">
                            {item.cantidad}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted">
                            {formatPEN(item.precioUnitario)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold font-mono text-ink">
                            {formatPEN(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-line bg-surface/75">
                    <tr>
                      <td colSpan={3} className="px-3.5 py-2.5 text-right font-bold text-ink">
                        Total de la venta:
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold font-mono text-accent-ink text-base">
                        {formatPEN(cobro.monto)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="border border-dashed border-line p-3 text-center text-xs text-muted">
                Sin desglose de productos específico.
              </p>
            )}
          </div>
        )}

        {/* Ticket info (si es ticket) */}
        {!isVenta && (
          <div className="flex flex-col gap-2 rounded border border-line p-3.5 bg-surface/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Referencia del Servicio
            </span>
            <p className="text-sm text-ink">
              Este cobro corresponde al{' '}
              <strong className="text-accent-ink">{cobroTipoLabel(cobro.tipo).toLowerCase()}</strong>{' '}
              del ticket técnico <strong>{cobro.codigo}</strong>.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
