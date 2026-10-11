import { httpClient } from '../../shared/api/httpClient.js';

export const accountApi = {
  updateEmail: ({ currentPassword, newEmail }) =>
    httpClient.patch('/account/email', { currentPassword, newEmail }),
  updatePassword: ({ currentPassword, newPassword }) =>
    httpClient.patch('/account/password', { currentPassword, newPassword }),
};
