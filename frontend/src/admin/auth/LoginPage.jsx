import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth.js';
import LoginForm from './components/LoginForm.jsx';
import { ApiError } from '../shared/api/httpClient.js';

/** Container: owns submit state/errors, redirects on success. */
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? '/admin/inventario'} replace />;
  }

  const handleSubmit = async ({ username, password }) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate(location.state?.from?.pathname ?? '/admin/inventario', { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-brand-navy px-4">
      <img src="/Armalytech_logo.png" alt="ArmalyTech" className="h-16 w-16 object-contain" />
      <h1 className="text-xl font-semibold text-brand-ink">Panel de administración</h1>
      <LoginForm onSubmit={handleSubmit} submitting={submitting} error={error} />
    </div>
  );
}
