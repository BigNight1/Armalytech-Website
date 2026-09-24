// Reuses the admin panel's shared httpClient (same fetch wrapper, JSON
// envelope unwrap, ApiError) instead of duplicating a fetch helper for the
// public registration form.
import { httpClient } from '../../admin/shared/api/httpClient.js';

/**
 * Public community API service (`/api/community/*`). This page has no
 * session, so 401s (which never happen here) never trigger the admin's
 * `onUnauthorized` redirect handling.
 */
export const communityApi = {
  register: ({ firstName, lastName, phone, marketingConsent, channel }) =>
    httpClient.post(
      `/community/register?canal=${encodeURIComponent(channel ?? 'qr')}`,
      { firstName, lastName, phone, marketingConsent },
      { skipUnauthorizedHandler: true },
    ),
};
