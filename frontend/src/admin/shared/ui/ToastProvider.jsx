import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TYPE_CLASSES = {
  info: 'border-line bg-surface text-ink',
  success: 'border-accent bg-accent-100 text-accent-900',
  error: 'border-danger bg-danger-bg text-danger-ink',
};

const DEFAULT_DURATION_MS = 4000;

/**
 * Non-blocking toast/notification stack (ADR 0010: notify without blocking
 * the UI). Wrap the admin tree once; feature code calls `useToast()`.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message, { type = 'info', duration = DEFAULT_DURATION_MS } = {}) => {
      const id = ++idRef.current;
      // Skip a message that is already on screen (e.g. several queries
      // failing with the same error).
      setToasts((current) =>
        current.some((toast) => toast.message === message && toast.type === type)
          ? current
          : [...current, { id, message, type }],
      );
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto border px-4 py-3 text-sm shadow-admin-lg ${
              TYPE_CLASSES[toast.type] ?? TYPE_CLASSES.info
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** `useToast().notify(message, { type: 'success' | 'error' | 'info' })`. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
