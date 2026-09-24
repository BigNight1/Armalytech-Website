import { useState } from 'react';
import { useAuth } from '../useAuth.js';
import { useToast, Button, Input } from '../../shared/ui/index.js';
import { httpClient } from '../../shared/api/httpClient.js';

export default function MustChangePasswordModal() {
  const { user, login } = useAuth();
  const { notify } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user || !user.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      notify('La nueva contraseña debe tener al menos 8 caracteres', { type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      notify('Las contraseñas no coinciden', { type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await httpClient.patch('/account/password', {
        currentPassword,
        newPassword,
      });
      notify('¡Contraseña actualizada con éxito!', { type: 'success' });
      // Refresh current session state
      await login(user.email, newPassword);
    } catch (err) {
      notify(err.message || 'Error al actualizar contraseña', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-brand-navy p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-white">Crea tu nueva contraseña</h2>
        <p className="mt-2 text-sm text-slate-300">
          Esta es tu primera vez ingresando con una contraseña temporal. Por seguridad, debes crear
          tu contraseña personal para continuar.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Contraseña actual (temporal)"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Nueva contraseña (mínimo 8 caracteres)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="mt-4 w-full">
            {loading ? 'Guardando…' : 'Establecer nueva contraseña y entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
