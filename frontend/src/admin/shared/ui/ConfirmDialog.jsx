import { TriangleAlert } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

/**
 * Confirm/cancel modal for destructive actions (deletes, stock resets, etc.)
 * — the design's 500px confirm dialog (`confirm` panel in `Panel Admin
 * Rediseño.dc.html`), icon + title/message together, no header row (we
 * build that block ourselves via `header={null}` on `Modal`, so a plain
 * `<h2>` isn't duplicated above it).
 */
export default function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  loading = false,
  icon = <TriangleAlert size={20} />,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      header={null}
      size="sm"
      onClose={onCancel}
      tone={danger ? 'danger' : 'accent'}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        {icon && (
          <span
            className={`flex h-11 w-11 flex-none items-center justify-center ${
              danger ? 'bg-danger-bg text-danger-ink' : 'bg-accent-100 text-accent-800'
            }`}
          >
            {icon}
          </span>
        )}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl">{title}</h2>
          <p className="text-base leading-[1.55] text-muted">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
