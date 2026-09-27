import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import Button from './Button.jsx';

/**
 * Confirm-discard dialog for the unsaved-changes guard (`useUnsavedGuard`).
 * Rendered above every other overlay (`z-[60]`, drawers/modals sit at
 * `z-50`) so it can interrupt closing a dirty form/drawer. Esc and backdrop
 * click both map to "Seguir editando" (never discard implicitly); Esc uses
 * a capture-phase listener so a `Modal` underneath doesn't also react to
 * the same keypress. "Seguir editando" carries `autoFocus` (Button forwards
 * it to the native `<button>`) so keyboard/Enter defaults to the safe option.
 */
export default function DiscardChangesDialog({ open, onCancel, onDiscard }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel?.();
      }
    };

    // Capture phase: intercept Esc before it reaches an underlying Modal's
    // own (bubble-phase) Escape handler.
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="flex w-full max-w-[420px] flex-col gap-4 border-t-4 border-danger bg-bg p-6 text-ink shadow-admin-lg"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label="¿Descartar los cambios?"
      >
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 flex-none items-center justify-center bg-danger-bg text-danger-ink">
            <TriangleAlert size={20} />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl">¿Descartar los cambios?</h2>
            <p className="text-[15px] leading-[1.55] text-muted">
              Lo que escribiste en este formulario se perderá.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} autoFocus>
            Seguir editando
          </Button>
          <Button type="button" variant="danger" onClick={onDiscard}>
            Descartar
          </Button>
        </div>
      </div>
    </div>
  );
}
