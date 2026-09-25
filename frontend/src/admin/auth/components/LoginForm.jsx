import { useState } from 'react';
import { ArrowRight, CircleAlert, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../shared/ui/index.js';

/** Presentational login form. Never calls the API directly; that's `LoginPage`'s job. */
export default function LoginForm({ onSubmit, submitting, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5 border-b-2 border-line pb-6">
        <span className="text-sm font-bold uppercase tracking-[0.14em] text-accent-ink">Acceso del personal</span>
        <h2 className="text-[32px] font-extrabold leading-none tracking-[-0.02em] sm:text-[44px]">Ingresar</h2>
        <p className="text-base leading-[1.55] text-muted">
          Usa el correo y la contraseña que te asignó el administrador principal.
        </p>
      </div>

      <Input
        id="login-email"
        name="email"
        type="email"
        size="xl"
        label="Correo electrónico"
        autoComplete="email"
        placeholder="ejemplo@armalytech.com"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
      />

      <Input
        id="login-password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        size="xl"
        label="Contraseña"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        className="pr-[50px]"
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-0 top-0 flex h-[50px] w-[50px] items-center justify-center border-0 bg-transparent text-muted hover:text-accent-ink"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 border-t-2 border-danger bg-danger-bg px-3.5 py-3 text-[15px] text-danger-ink">
          <CircleAlert size={18} className="mt-px flex-none" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-[54px] w-full items-center justify-between border border-accent bg-accent px-[18px] text-[17px] font-bold text-on-accent transition-colors hover:bg-accent-600 active:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span>{submitting ? 'Ingresando…' : 'Ingresar'}</span>
        <ArrowRight size={20} />
      </button>

      <p className="text-[15px] leading-[1.5] text-muted">
        ¿Olvidaste tu contraseña? El administrador principal puede asignarte una clave temporal desde Personal.
      </p>
    </form>
  );
}
