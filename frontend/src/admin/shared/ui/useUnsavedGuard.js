import { useCallback, useState } from 'react';

/**
 * Shared "unsaved changes" close guard (contract in
 * `odd/tasks/unsaved-changes-guard.md`). Every dismiss path of a form
 * modal/drawer (✕, Esc, backdrop when dismissible, footer "Cancelar")
 * should call `requestClose()` instead of the raw close handler:
 * - not dirty -> closes immediately via `onClose`.
 * - dirty -> opens the confirm (`confirmOpen`); `confirmDiscard` actually
 *   closes, `cancelDiscard` just hides the confirm ("Seguir editando").
 *
 * `Modal` uses this internally for its own dismiss paths (✕/Esc/backdrop);
 * custom drawers that don't use `Modal` (NewTicketDrawer, RegisterSaleDrawer,
 * TicketDetailDrawer) call it directly alongside `DiscardChangesDialog`.
 */
export default function useUnsavedGuard(isDirty, onClose) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      onClose?.();
    }
  }, [isDirty, onClose]);

  const confirmDiscard = useCallback(() => {
    setConfirmOpen(false);
    onClose?.();
  }, [onClose]);

  const cancelDiscard = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  return { requestClose, confirmOpen, confirmDiscard, cancelDiscard };
}
