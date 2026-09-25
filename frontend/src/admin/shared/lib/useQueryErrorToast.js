import { useEffect } from 'react';
import { useToast } from '../ui/ToastProvider.jsx';

/**
 * Shows a query error once, when it appears. Calling `notify` directly in a
 * hook body runs on every render and floods the toast stack.
 */
export function useQueryErrorToast(error, fallbackMessage) {
  const { notify } = useToast();

  useEffect(() => {
    if (error) notify(error.message ?? fallbackMessage, { type: 'error' });
  }, [error, fallbackMessage, notify]);
}
