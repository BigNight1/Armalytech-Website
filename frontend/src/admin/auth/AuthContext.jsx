import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api/authApi.js';
import { onUnauthorized } from '../shared/api/httpClient.js';

export const AuthContext = createContext(null);

const STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
};

/**
 * Owns the admin session: checks `/auth/me` on mount, exposes `login`/`logout`,
 * and reacts to any later 401 (expired session) by clearing state and
 * bouncing to `/admin/login`.
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState(STATUS.LOADING);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    authApi
      .me({ skipUnauthorizedHandler: true })
      .then((data) => {
        if (!cancelled) {
          setAdmin(data);
          setStatus(STATUS.AUTHENTICATED);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus(STATUS.UNAUTHENTICATED);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      setAdmin(null);
      setStatus(STATUS.UNAUTHENTICATED);
      navigate('/admin/login', { replace: true });
    });

    return () => onUnauthorized(null);
  }, [navigate]);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    setAdmin(data);
    setStatus(STATUS.AUTHENTICATED);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAdmin(null);
      setStatus(STATUS.UNAUTHENTICATED);
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      admin,
      user: admin,
      status,
      isLoading: status === STATUS.LOADING,
      isAuthenticated: status === STATUS.AUTHENTICATED,
      login,
      logout,
    }),
    [admin, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
