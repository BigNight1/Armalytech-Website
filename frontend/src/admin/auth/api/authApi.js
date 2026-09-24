import { httpClient } from '../../shared/api/httpClient.js';

/** Auth API service (per API contract: `/api/auth/{login,logout,me}`). */
export const authApi = {
  login: (username, password) => httpClient.post('/auth/login', { username, password }),
  logout: () => httpClient.post('/auth/logout'),
  me: (options) => httpClient.get('/auth/me', options),
};
