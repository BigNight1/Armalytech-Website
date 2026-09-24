import { useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { accountApi } from './api/accountApi.js';
import { useToast, Button, Input } from '../shared/ui/index.js';

export default function AccountPage() {
  const { user, login } = useAuth();
  const { notify } = useToast();

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password form state
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!newEmail || !emailCurrentPassword) return;

    try {
      setSavingEmail(true);
      await accountApi.updateEmail({
        currentPassword: emailCurrentPassword,
        newEmail,
      });
      notify('Correo actualizado correctamente', { type: 'success' });
      // Re-login locally to refresh user context
      await login(newEmail, emailCurrentPassword);
      setNewEmail('');
      setEmailCurrentPassword('');
    } catch (err) {
      notify(err.message || 'Error al actualizar el correo', { type: 'error' });
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      notify('La nueva contraseña debe tener al menos 8 caracteres', { type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      notify('Las nuevas contraseñas no coinciden', { type: 'error' });
      return;
    }

    try {
      setSavingPassword(true);
      await accountApi.updatePassword({
        currentPassword: passwordCurrentPassword,
        newPassword,
      });
      notify('Contraseña actualizada correctamente. Las demás sesiones fueron cerradas.', {
        type: 'success',
      });
      setPasswordCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      notify(err.message || 'Error al actualizar la contraseña', { type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-ink">Mi Cuenta</h1>
        <p className="text-sm text-slate-400">
          Gestiona tu correo de acceso y tus credenciales de seguridad.
        </p>
      </div>

      {/* Info perfil */}
      <div className="rounded-xl border border-slate-700 bg-brand-navy p-6">
        <h2 className="text-base font-medium text-white">Datos de la sesión</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Correo actual</label>
            <p className="text-sm font-medium text-brand-ink">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-slate-400">Rol en el panel</label>
            <div className="mt-1">
              {user?.role === 'owner' ? (
                <span className="inline-flex rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400">
                  Principal (Owner)
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                  Personal (Admin)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Cambiar Email */}
        <div className="rounded-xl border border-slate-700 bg-brand-navy p-6">
          <h2 className="text-base font-medium text-white">Cambiar correo electrónico</h2>
          <p className="mt-1 text-xs text-slate-400">
            Ingresa tu nuevo correo y confirma con tu contraseña actual.
          </p>

          <form onSubmit={handleEmailSubmit} className="mt-4 flex flex-col gap-4">
            <Input
              label="Nuevo correo electrónico"
              type="email"
              placeholder="nuevo@armalytech.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <Input
              label="Contraseña actual"
              type="password"
              placeholder="••••••••"
              value={emailCurrentPassword}
              onChange={(e) => setEmailCurrentPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={savingEmail} className="mt-2">
              {savingEmail ? 'Guardando…' : 'Guardar nuevo correo'}
            </Button>
          </form>
        </div>

        {/* Cambiar Contraseña */}
        <div className="rounded-xl border border-slate-700 bg-brand-navy p-6">
          <h2 className="text-base font-medium text-white">Cambiar contraseña</h2>
          <p className="mt-1 text-xs text-slate-400">
            Al cambiar tu contraseña, cualquier otra sesión abierta en otros dispositivos se
            cerrará por seguridad.
          </p>

          <form onSubmit={handlePasswordSubmit} className="mt-4 flex flex-col gap-4">
            <Input
              label="Contraseña actual"
              type="password"
              placeholder="••••••••"
              value={passwordCurrentPassword}
              onChange={(e) => setPasswordCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Nueva contraseña (mínimo 8 caracteres)"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={savingPassword} className="mt-2">
              {savingPassword ? 'Actualizando…' : 'Actualizar contraseña'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
