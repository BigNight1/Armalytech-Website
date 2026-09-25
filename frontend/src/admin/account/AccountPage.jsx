import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { accountApi } from './api/accountApi.js';
import { useToast } from '../shared/ui/index.js';
import { useTheme } from '../shared/theme/ThemeProvider.jsx';
import { useBreadcrumb } from '../shared/layout/breadcrumb.jsx';
import AccountTabs from './components/AccountTabs.jsx';
import ProfileTab from './components/ProfileTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';

const VALID_TABS = ['perfil', 'config'];

/**
 * Container: reads `?tab=perfil|config` (Sidebar's user menu links here),
 * owns the email/password form state and API calls, wires Configuración's
 * theme picker to `useTheme()`. Task brief keeps both credential forms
 * (email + password) under Perfil — see `ProfileTab.jsx` for why that
 * diverges from the design's own tab split.
 */
export default function AccountPage() {
  const { user, login } = useAuth();
  const { notify } = useToast();
  const { isDark, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : 'perfil';

  useBreadcrumb(activeTab === 'perfil' ? 'Perfil' : 'Configuración');

  const setActiveTab = (tab) => {
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.set('tab', tab);
      return next;
    });
  };

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
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">Mi cuenta</span>
        <h1 className="text-[40px]">{activeTab === 'perfil' ? 'Perfil' : 'Configuración'}</h1>
        <p className="mt-1 text-base text-muted">Gestiona tu correo de acceso y tus credenciales de seguridad.</p>
      </div>

      <AccountTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'perfil' ? (
        <ProfileTab
          user={user}
          emailForm={{
            newEmail,
            currentPassword: emailCurrentPassword,
            saving: savingEmail,
            onNewEmailChange: (e) => setNewEmail(e.target.value),
            onCurrentPasswordChange: (e) => setEmailCurrentPassword(e.target.value),
            onSubmit: handleEmailSubmit,
          }}
        />
      ) : (
        <SettingsTab
          isDark={isDark}
          onSetLight={() => setTheme('claro')}
          onSetDark={() => setTheme('oscuro')}
          passwordForm={{
            currentPassword: passwordCurrentPassword,
            newPassword,
            confirmPassword,
            saving: savingPassword,
            onCurrentPasswordChange: (e) => setPasswordCurrentPassword(e.target.value),
            onNewPasswordChange: (e) => setNewPassword(e.target.value),
            onConfirmPasswordChange: (e) => setConfirmPassword(e.target.value),
            onSubmit: handlePasswordSubmit,
          }}
        />
      )}
    </div>
  );
}
