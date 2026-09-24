import { staffApi } from './staffApi.js';

/**
 * Warms the cache for the Personal section so it loads instantly on hover/click.
 */
export function prefetchStaff(queryClient) {
  return queryClient.prefetchQuery({
    queryKey: ['admin', 'staff'],
    queryFn: async () => {
      const res = await staffApi.list();
      return Array.isArray(res) ? res : res.data ?? [];
    },
  });
}
