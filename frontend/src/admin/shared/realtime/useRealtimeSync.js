import { useEffect, useRef } from 'react';
import { queryClient } from '../api/queryClient.js';
import { useAuth } from '../../auth/useAuth.js';
import { useToast } from '../ui/index.js';
import { REALTIME_TOPIC_KEYS, REALTIME_ALL_ROOT_KEYS } from './realtimeTopics.js';

// Manual reopen backoff for streams the browser closed for good (non-200).
const RETRY_MIN_MS = 2_000;
const RETRY_MAX_MS = 30_000;

const REASON_MESSAGES = {
  client_registered: 'Se registró un nuevo cliente',
};

/**
 * Realtime panel sync (ADR 0028): opens `GET /api/events` (Server-Sent
 * Events, same origin, session cookie sent automatically) while the admin is
 * authenticated, and invalidates the React Query root key for whatever
 * topic the backend announces. The event never carries business data — the
 * panel always refetches through the normal API.
 *
 * Network drops are retried by `EventSource` itself; non-200 answers (proxy
 * 502 during a backend restart) close it for good, so the hook reopens it
 * with backoff. After any reconnect it runs a single catch-up invalidation
 * of every mapped root key, so changes missed while disconnected still show
 * up — without spamming toasts.
 */
export function useRealtimeSync() {
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    // Environments without EventSource (old browsers, some test runners):
    // no-op, the panel just keeps behaving like before ADR 0028.
    if (typeof EventSource === 'undefined') {
      return undefined;
    }

    let source = null;
    let hadError = false;
    let retryTimer = null;
    let retryDelay = RETRY_MIN_MS;
    let disposed = false;

    const invalidateAll = () => {
      REALTIME_ALL_ROOT_KEYS.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    };

    const handleOpen = () => {
      retryDelay = RETRY_MIN_MS;
      if (hadError) {
        // Reconnected after a drop: catch up once, no toast.
        hadError = false;
        invalidateAll();
      }
    };

    const handleError = () => {
      hadError = true;
      // Network drops keep the source CONNECTING and the browser retries by
      // itself. A non-200 answer (e.g. nginx 502 while the backend restarts,
      // or 401) closes it for good, so reopen it ourselves with backoff. If
      // the session really expired, the API 401 handler logs the admin out,
      // which unmounts this hook and stops the loop.
      if (source.readyState === EventSource.CLOSED && !disposed) {
        clearTimeout(retryTimer);
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
      }
    };

    const handleInvalidate = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      const queryKey = REALTIME_TOPIC_KEYS[payload?.topic];
      if (!queryKey) {
        return;
      }

      queryClient.invalidateQueries({ queryKey });

      const message = REASON_MESSAGES[payload?.reason];
      if (message) {
        notifyRef.current(message, { type: 'info' });
      }
    };

    function closeSource() {
      if (!source) return;
      source.removeEventListener('open', handleOpen);
      source.removeEventListener('error', handleError);
      source.removeEventListener('invalidate', handleInvalidate);
      source.close();
    }

    function connect() {
      closeSource();
      source = new EventSource('/api/events');
      source.addEventListener('open', handleOpen);
      source.addEventListener('error', handleError);
      source.addEventListener('invalidate', handleInvalidate);
      // `ping` is intentionally not listened to: it's just a heartbeat.
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      closeSource();
    };
  }, [isAuthenticated]);
}
