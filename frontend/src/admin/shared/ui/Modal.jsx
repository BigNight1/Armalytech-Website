import { useEffect } from 'react';
import useUnsavedGuard from './useUnsavedGuard.js';
import DiscardChangesDialog from './DiscardChangesDialog.jsx';

const TONE_BORDER = {
  accent: 'border-accent',
  danger: 'border-danger',
};

// Design-matched fixed widths: sm=500 (confirm/reset dialogs), md=620
// (product-form drawer), lg=640 (client-detail drawer), xl=820 (movements
// dialog). Omitting `size` keeps the original `max-w-lg` (512px) dialog
// width, so callers that don't pass it (StaffPage, RegisterVisitModal)
// render unchanged.
const SIZE_WIDTH = {
  sm: 'max-w-[500px]',
  md: 'max-w-[620px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[820px]',
};

/**
 * Overlay modal. Two shapes, matching the design:
 * - `variant="dialog"` (default): centered box. `size` (`sm|md|lg|xl`,
 *   widths above) picks a design-matched fixed width; omit it for the
 *   original 512px width. `bordered` switches to the design's "panel"
 *   chrome (divided header/footer, scrollable body, 40x40 close button) —
 *   used for wide content dialogs like Movements; the default (false) keeps
 *   the original compact chrome (small dialogs, confirm/staff/register).
 * - `variant="drawer"`: right-side, full-height slide-in panel (product
 *   form, client detail) with the design's accent left border and panel
 *   chrome; `w-full` + a fixed `max-w-*` makes it full-width below the
 *   width it's capped at (no extra breakpoint needed).
 *
 * Closes on backdrop click, Escape, or the X button. `tone` controls the
 * accent/danger border — defaults to 'accent' so existing callers don't
 * need to change. `header` renders custom content (kicker + title, avatar,
 * ...) in place of the plain `title` heading — pass `header={null}` to
 * render no header content at all (e.g. `ConfirmDialog`, which builds its
 * own icon + title block in `children`). `title` always sets `aria-label`.
 *
 * `dismissible` (default `true`, current behavior) gates backdrop click:
 * `false` makes the backdrop a no-op, for forms that must only close via
 * ✕/Esc/"Cancelar" (unsaved-changes guard, `odd/tasks/unsaved-changes-guard.md`).
 * `isDirty` (default `false`) feeds the same guard: every dismiss path (✕,
 * Esc, backdrop when dismissible) goes through it internally, showing
 * `DiscardChangesDialog` when dirty instead of closing outright. `footer`
 * and `children` may be a function `(requestClose) => node` instead of a
 * plain node, so a caller's own "Cancelar" button (in the footer or inside
 * the body) can also call the exact same guarded closer — plain nodes still
 * work unchanged for callers that don't need this (`ConfirmDialog`,
 * `MovementsModal`, `CobroDetailModal`, ...).
 */
export default function Modal({
  open,
  title,
  header,
  onClose,
  children,
  footer,
  tone = 'accent',
  size,
  variant = 'dialog',
  bordered = false,
  dismissible = true,
  isDirty = false,
}) {
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        requestClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, requestClose]);

  if (!open) {
    return null;
  }

  const toneBorder = TONE_BORDER[tone] ?? TONE_BORDER.accent;
  const isDrawer = variant === 'drawer';
  const widthClass = size ? SIZE_WIDTH[size] ?? SIZE_WIDTH.md : isDrawer ? SIZE_WIDTH.md : 'max-w-lg';
  const usesPanelChrome = isDrawer || bordered;

  const headerNode = header !== undefined ? header : <h2 className={isDrawer ? 'text-2xl' : 'text-xl'}>{title}</h2>;
  const bodyContent = typeof children === 'function' ? children(requestClose) : children;
  const footerContent = typeof footer === 'function' ? footer(requestClose) : footer;
  const handleBackdropClick = dismissible ? requestClose : undefined;

  const closeButton = usesPanelChrome ? (
    <button
      type="button"
      onClick={requestClose}
      aria-label="Cerrar"
      className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-ink hover:border-accent hover:text-accent-ink"
    >
      &#10005;
    </button>
  ) : (
    <button type="button" onClick={requestClose} className="text-muted hover:text-accent-ink" aria-label="Cerrar">
      &#10005;
    </button>
  );

  const discardDialog = (
    <DiscardChangesDialog open={confirmOpen} onCancel={cancelDiscard} onDiscard={confirmDiscard} />
  );

  if (isDrawer) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={handleBackdropClick} role="presentation">
          <div
            className={`flex h-full w-full ${widthClass} flex-col border-l-4 ${toneBorder} bg-bg text-ink shadow-admin-lg`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex h-[84px] shrink-0 items-center justify-between gap-4 border-b-2 border-line px-4 sm:px-7">
              {headerNode}
              {closeButton}
            </div>
            <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-4 sm:px-7 py-6">{bodyContent}</div>
            {footerContent && (
              <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t-2 border-line px-4 sm:px-7 py-[18px]">{footerContent}</div>
            )}
          </div>
        </div>
        {discardDialog}
      </>
    );
  }

  if (bordered) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleBackdropClick}
          role="presentation"
        >
          <div
            className={`flex max-h-[85vh] w-full ${widthClass} flex-col border-t-4 ${toneBorder} bg-bg text-ink shadow-admin-lg`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-line px-4 sm:px-7 py-5">
              {headerNode}
              {closeButton}
            </div>
            <div className="flex-1 overflow-auto px-4 sm:px-7 py-5 text-[15px] text-ink">{bodyContent}</div>
            {footerContent && <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t-2 border-line px-4 sm:px-7 py-4">{footerContent}</div>}
          </div>
        </div>
        {discardDialog}
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        onClick={handleBackdropClick}
        role="presentation"
      >
        <div
          className={`w-full ${widthClass} border-t-4 bg-bg p-7 text-ink shadow-admin-lg ${toneBorder}`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            {headerNode}
            {closeButton}
          </div>
          <div className="text-[15px] text-ink">{bodyContent}</div>
          {footerContent && <div className="mt-6 flex justify-end gap-3">{footerContent}</div>}
        </div>
      </div>
      {discardDialog}
    </>
  );
}
