import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './httpClient.js';

/**
 * Shared TanStack Query client for the admin panel (T14). Sensible defaults
 * for a small internal tool: short `staleTime` so navigating between
 * sections feels instant (cache hit) without serving very stale data,
 * `refetchOnWindowFocus` on so a re-focused tab picks up changes made
 * elsewhere, and no retries on 4xx (client errors won't fix themselves).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
