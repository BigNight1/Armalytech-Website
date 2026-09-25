import { Button, Input, Tag } from '../../shared/ui/index.js';
import { getDisplayName, getInitials, getRoleLabel } from '../../shared/lib/userDisplay.js';

/**
 * Perfil tab: session info + email change, matching the design's own
 * Perfil/Configuración split (`Panel Admin Rediseño.dc.html` lines
 * ~566-621) — "Cambiar contraseña" lives in `SettingsTab.jsx` instead.
 */
export default function ProfileTab({ user, emailForm }) {
  const displayName = getDisplayName(user?.email) || 'Cuenta';
  const initials = getInitials(user?.email) || '--';
  const roleLabel = getRoleLabel(user?.role);

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-8 border-t-2 border-ink pt-6 md:grid-cols-2 md:gap-0">
        <section className="flex flex-col gap-5 md:py-6 md:pr-8">
          <h2 className="text-[22px]">Datos de la sesión</h2>
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 flex-none place-items-center bg-accent text-[22px] font-extrabold text-on-accent">
              {initials}
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-lg font-bold text-ink">{displayName}</span>
              <Tag variant="solid" className="self-start">
                {roleLabel}
              </Tag>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-line">
            <div className="flex flex-col gap-1 py-3.5">
              <span className="text-sm text-muted">Correo actual</span>
              <span className="text-base font-semibold text-ink">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-line py-3.5 pl-5">
              <span className="text-sm text-muted">Rol en el panel</span>
              <span className="text-base font-semibold text-ink">{roleLabel}</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 border-t-2 border-line pt-6 md:border-l-2 md:border-t-0 md:py-6 md:pl-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[22px]">Cambiar correo electrónico</h2>
            <p className="text-[15px] text-muted">Ingresa tu nuevo correo y confirma con tu contraseña actual.</p>
          </div>
          <form onSubmit={emailForm.onSubmit} className="flex max-w-md flex-col gap-4">
            <Input
              size="lg"
              label="Nuevo correo electrónico"
              type="email"
              placeholder="nuevo@armalytech.com"
              value={emailForm.newEmail}
              onChange={emailForm.onNewEmailChange}
              required
            />
            <Input
              size="lg"
              label="Contraseña actual"
              type="password"
              placeholder="••••••••"
              value={emailForm.currentPassword}
              onChange={emailForm.onCurrentPasswordChange}
              required
            />
            <Button type="submit" disabled={emailForm.saving} className="self-start">
              {emailForm.saving ? 'Guardando…' : 'Guardar nuevo correo'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
