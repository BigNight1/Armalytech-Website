import { Button, Input } from '../../shared/ui/index.js';

const OPTION_BASE =
  'flex cursor-pointer flex-col gap-2.5 border-2 bg-transparent p-3 text-left text-ink';

function optionClass(active) {
  return `${OPTION_BASE} ${active ? 'border-accent' : 'border-line'}`;
}

/**
 * Configuración tab: Cambiar contraseña (left) + Apariencia (right), matching
 * the design's own Perfil/Configuración split (`Panel Admin Rediseño.dc.html`
 * lines ~593-621) — Perfil (`ProfileTab.jsx`) only keeps session data +
 * email change, no longer the password form.
 */
export default function SettingsTab({ isDark, onSetLight, onSetDark, passwordForm }) {
  return (
    <div className="grid grid-cols-1 gap-8 border-t-2 border-ink pt-6 md:grid-cols-2 md:gap-0">
      <section className="flex flex-col gap-4 md:pr-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[22px]">Cambiar contraseña</h2>
          <p className="text-[15px] text-muted">
            Al cambiar tu contraseña, cualquier otra sesión abierta en otros dispositivos se cerrará por seguridad.
          </p>
        </div>
        <form onSubmit={passwordForm.onSubmit} className="flex max-w-md flex-col gap-4">
          <Input
            size="lg"
            label="Contraseña actual"
            type="password"
            placeholder="••••••••"
            value={passwordForm.currentPassword}
            onChange={passwordForm.onCurrentPasswordChange}
            required
          />
          <Input
            size="lg"
            label="Nueva contraseña (mínimo 8 caracteres)"
            type="password"
            placeholder="••••••••"
            value={passwordForm.newPassword}
            onChange={passwordForm.onNewPasswordChange}
            required
          />
          <Input
            size="lg"
            label="Confirmar nueva contraseña"
            type="password"
            placeholder="••••••••"
            value={passwordForm.confirmPassword}
            onChange={passwordForm.onConfirmPasswordChange}
            required
          />
          <Button type="submit" disabled={passwordForm.saving} className="self-start">
            {passwordForm.saving ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-4 border-t-2 border-line pt-6 md:border-l-2 md:border-t-0 md:pl-8 md:pt-0">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[22px]">Apariencia</h2>
          <p className="text-[15px] text-muted">Se guarda en este navegador.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={onSetLight} className={optionClass(!isDark)}>
            <span className="flex h-24 border border-black/20 bg-[#f8fafc]">
              <span className="w-[28%] bg-[#0f172a]" />
              <span className="flex flex-1 flex-col gap-1.5 p-2.5">
                <span className="h-2 w-3/5 bg-[#0f172a]" />
                <span className="h-2 w-[30%] bg-[#f97316]" />
              </span>
            </span>
            <span className="text-[15px] font-bold">Claro</span>
          </button>
          <button type="button" onClick={onSetDark} className={optionClass(isDark)}>
            <span className="flex h-24 border border-black/20 bg-[#0f172a]">
              <span className="w-[28%] bg-[#020617]" />
              <span className="flex flex-1 flex-col gap-1.5 p-2.5">
                <span className="h-2 w-3/5 bg-[#e2e8f0]" />
                <span className="h-2 w-[30%] bg-[#f97316]" />
              </span>
            </span>
            <span className="text-[15px] font-bold">Oscuro</span>
          </button>
        </div>
      </section>
    </div>
  );
}
