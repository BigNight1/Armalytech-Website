import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button, Modal } from '../../shared/ui/index.js';
import { formatPEN } from '../../shared/lib/money.js';
import { cobroTipoLabel } from '../lib/cobroRows.js';

/**
 * Owner-only "Anular cobro" confirm dialog (T-C3): same 500px danger-toned
 * chrome as `ConfirmDialog`, built directly on `Modal` because it needs a
 * required motivo textarea that `ConfirmDialog`'s plain `message` string
 * can't carry.
 */
export default function AnularCobroDialog({ cobro, loading, onConfirm, onCancel }) {
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    setMotivo('');
  }, [cobro]);

  const open = Boolean(cobro);
  const trimmed = motivo.trim();

  return (
    <Modal
      open={open}
      title="Anular cobro"
      header={null}
      size="sm"
      tone="danger"
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(trimmed)}
            disabled={loading || !trimmed}
          >
            {loading ? 'Anulando…' : 'Anular cobro'}
          </Button>
        </>
      }
    >
      {cobro && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 flex-none items-center justify-center bg-danger-bg text-danger-ink">
              <TriangleAlert size={20} />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl">Anular cobro</h2>
              <p className="text-base leading-[1.55] text-muted">
                {cobroTipoLabel(cobro.tipo)} {cobro.codigo} · {formatPEN(cobro.monto)} ({cobro.metodo}).{' '}
                {cobro.tipo === 'venta'
                  ? 'Quedará fuera de los totales del Historial y los productos volverán automáticamente al inventario (stock).'
                  : 'Quedará fuera de los totales del Historial, pero no se borra.'}
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm text-ink">
            <span className="text-xs font-medium text-muted">Motivo de anulación (obligatorio)</span>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="w-full resize-none border border-line bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-muted focus:outline-none focus-visible:border-accent"
              placeholder="Explica por qué se anula este cobro…"
            />
          </label>
        </div>
      )}
    </Modal>
  );
}
