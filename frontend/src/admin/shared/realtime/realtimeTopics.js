import { clientsKeys } from '../../clients/api/queryKeys.js';
import { ticketQueryKeys } from '../../tickets/api/queryKeys.js';
import { inventoryKeys } from '../../inventory/api/queryKeys.js';
import { cashClosingsKeys } from '../../cash-closings/api/queryKeys.js';

/**
 * Maps each realtime `topic` (ADR 0028 / `GET /api/events`) to the React
 * Query root key it invalidates. Kept in its own module so
 * `useRealtimeSync` doesn't import every feature's query-key factory
 * directly — features stay decoupled from the realtime wiring, and adding a
 * topic only touches this map.
 */
export const REALTIME_TOPIC_KEYS = {
  clients: clientsKeys.all,
  tickets: ticketQueryKeys.all,
  sales: cashClosingsKeys.all,
  inventory: inventoryKeys.all,
  staff: ['admin', 'staff'],
};

/** All mapped root keys, for the reconnect catch-up invalidation. */
export const REALTIME_ALL_ROOT_KEYS = Object.values(REALTIME_TOPIC_KEYS);
