export const ticketQueryKeys = {
  all: ['tickets'],
  lists: () => [...ticketQueryKeys.all, 'list'],
  list: (filters) => [...ticketQueryKeys.lists(), filters],
  details: () => [...ticketQueryKeys.all, 'detail'],
  detail: (id) => [...ticketQueryKeys.details(), id],
  clientHistory: (clienteId) => [...ticketQueryKeys.all, 'client-history', clienteId],
  technicians: ['technicians'],
  availability: (params) => [...ticketQueryKeys.all, 'availability', params],
};
