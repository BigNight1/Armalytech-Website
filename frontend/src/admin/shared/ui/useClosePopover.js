import { useEffect } from 'react';

/**
 * Closes an open popover on an outside click or Escape (T16: `DatePicker`/
 * `DateRangePicker`). `containerRef` must wrap both the trigger and the
 * popover panel so a click on the trigger itself doesn't immediately
 * re-close what it just opened.
 */
export function useClosePopover(containerRef, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isOpen, onClose]);
}
