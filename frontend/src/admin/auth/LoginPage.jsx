import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from './useAuth.js';
import LoginBrandPanel from './components/LoginBrandPanel.jsx';
import LoginForm from './components/LoginForm.jsx';
import { ApiError } from '../shared/api/httpClient.js';
import { useTheme } from '../shared/theme/ThemeProvider.jsx';

/** Container: owns submit state/errors, redirects on success. */
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
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
    <div className="flex min-h-screen flex-col bg-bg text-ink lg:flex-row">
      <LoginBrandPanel />

      <div className="flex flex-1 flex-col px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="flex h-[42px] items-center gap-2 border border-line px-3.5 text-[15px] font-semibold text-ink hover:border-accent hover:text-accent-ink"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <LoginForm onSubmit={handleSubmit} submitting={submitting} error={error} />
        </div>

        <div className="flex justify-between border-t border-line pt-4 text-sm text-muted">
          <span>© 2026 ArmalyTech</span>
          <span>armalytech.com/admin</span>
        </div>
      </div>
    </div>
  );
}
