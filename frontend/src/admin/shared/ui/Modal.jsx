import { useEffect } from 'react';

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
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const toneBorder = TONE_BORDER[tone] ?? TONE_BORDER.accent;
  const isDrawer = variant === 'drawer';
  const widthClass = size ? SIZE_WIDTH[size] ?? SIZE_WIDTH.md : isDrawer ? SIZE_WIDTH.md : 'max-w-lg';
  const usesPanelChrome = isDrawer || bordered;

  const headerNode = header !== undefined ? header : <h2 className={isDrawer ? 'text-2xl' : 'text-xl'}>{title}</h2>;

  const closeButton = usesPanelChrome ? (
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar"
      className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-ink hover:border-accent hover:text-accent-ink"
    >
      &#10005;
    </button>
  ) : (
    <button type="button" onClick={onClose} className="text-muted hover:text-accent-ink" aria-label="Cerrar">
      &#10005;
    </button>
  );

  if (isDrawer) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose} role="presentation">
        <div
          className={`flex h-full w-full ${widthClass} flex-col border-l-4 ${toneBorder} bg-bg text-ink shadow-admin-lg`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex h-[84px] shrink-0 items-center justify-between gap-4 border-b-2 border-line px-7">
            {headerNode}
            {closeButton}
          </div>
          <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-7 py-6">{children}</div>
          {footer && (
            <div className="flex shrink-0 justify-end gap-2 border-t-2 border-line px-7 py-[18px]">{footer}</div>
          )}
        </div>
      </div>
    );
  }

  if (bordered) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className={`flex max-h-[85vh] w-full ${widthClass} flex-col border-t-4 ${toneBorder} bg-bg text-ink shadow-admin-lg`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-line px-7 py-5">
            {headerNode}
            {closeButton}
          </div>
          <div className="flex-1 overflow-auto px-7 py-5 text-[15px] text-ink">{children}</div>
          {footer && <div className="flex shrink-0 justify-end gap-2 border-t-2 border-line px-7 py-4">{footer}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
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
        <div className="text-[15px] text-ink">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
