/** TanStack Query key factory for the Clientes feature (T14). */
export const clientsKeys = {
  all: ['clients'],
  list: ({ q, page, limit, consent }) => [...clientsKeys.all, 'list', { q, page, limit, consent }],
  detail: (id) => [...clientsKeys.all, 'detail', id],
  events: (id) => [...clientsKeys.all, 'events', id],
  tickets: (id) => [...clientsKeys.all, 'tickets', id],
  communityEvents: ({ from, to, type }) => [...clientsKeys.all, 'community-events', { from, to, type }],
  stats: () => [...clientsKeys.all, 'stats'],
};
