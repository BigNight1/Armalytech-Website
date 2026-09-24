import { httpClient } from '../../shared/api/httpClient.js';

export const staffApi = {
  list: () => httpClient.get('/staff'),
  create: ({ email, password }) => httpClient.post('/staff', { email, password }),
  toggleStatus: (id, active) => httpClient.patch(`/staff/${id}/status`, { active }),
  resetPassword: (id, password) => httpClient.post(`/staff/${id}/reset-password`, { password }),
};
