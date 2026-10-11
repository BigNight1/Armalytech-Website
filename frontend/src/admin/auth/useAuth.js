import { useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';

/** `{ admin, status, isLoading, isAuthenticated, login, logout }`. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
