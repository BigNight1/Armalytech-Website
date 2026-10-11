import { httpClient } from '../../shared/api/httpClient.js';

/** Auth API service (per API contract: `/api/auth/{login,logout,me}`). */
export const authApi = {
  login: (emailOrUsername, password) =>
    httpClient.post('/auth/login', {
      email: emailOrUsername,
      username: emailOrUsername,
      password,
    }),
  logout: () => httpClient.post('/auth/logout'),
  me: (options) => httpClient.get('/auth/me', options),
};
