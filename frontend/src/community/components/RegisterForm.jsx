import { formatNationalPhoneInput } from '../lib/phone.js';

/**
 * Registration form (design: `/registrar/usuario` board, `isForm` branch of
 * `regScreen()`). Client-side validation mirrors the design's own messages;
 * the backend re-validates and its errors win (see RegisterPage).
 */
export default function RegisterForm({
  values,
  errors,
  bannerText,
  busy,
  onChange,
  onSubmit,
}) {
  const fieldClass = (hasError) =>
    'h-[50px] w-full bg-brand-navy-light px-3 font-semibold text-white outline-none placeholder:text-slate-500 ' +
    (hasError ? 'border-2 border-red-500' : 'border border-brand-ink/25');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-tight text-white">
          Únete a ArmalyTech Club
        </h1>
        <p className="text-base leading-snug text-slate-300">
          Acumula un sello en cada visita o reparación. Con 5 sellos tienes{' '}
          <strong className="text-brand-orange-300">20% de descuento</strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="reg-firstName" className="text-[15px] font-semibold">
            Nombre
          </label>
          <input
            id="reg-firstName"
            value={values.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            autoComplete="given-name"
            className={fieldClass(!!errors.firstName)}
          />
          {errors.firstName && (
            <span className="text-sm text-red-300">{errors.firstName}</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="reg-lastName" className="text-[15px] font-semibold">
            Apellido
          </label>
          <input
            id="reg-lastName"
            value={values.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            autoComplete="family-name"
            className={fieldClass(!!errors.lastName)}
          />
          {errors.lastName && (
            <span className="text-sm text-red-300">{errors.lastName}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-phone" className="text-[15px] font-semibold">
          Número de WhatsApp
        </label>
        <div
          className={
            'flex items-stretch bg-brand-navy-light ' +
            (errors.phone ? 'border-2 border-red-500' : 'border border-brand-ink/25')
          }
        >
          <span className="flex items-center border-r border-brand-ink/25 bg-white/[0.08] px-3 font-bold text-white">
            +51
          </span>
          <input
            id="reg-phone"
            type="tel"
            inputMode="numeric"
            placeholder="9XX XXX XXX"
            value={values.phone}
            onChange={(e) => onChange('phone', formatNationalPhoneInput(e.target.value))}
            autoComplete="tel-national"
            className="h-[50px] min-w-0 flex-1 bg-transparent px-3 font-semibold tracking-wide text-white outline-none [font-variant-numeric:tabular-nums]"
          />
        </div>
        {errors.phone && <span className="text-sm text-red-300">{errors.phone}</span>}
      </div>

      <label className="flex cursor-pointer items-start gap-3 border border-brand-ink/20 p-3">
        <input
          type="checkbox"
          checked={values.consent}
          onChange={(e) => onChange('consent', e.target.checked)}
          className="mt-0 h-[22px] w-[22px] flex-none accent-brand-orange"
        />
        <span className="flex flex-col gap-1">
          <span className="text-[15px] leading-snug">
            Acepto recibir ofertas y promociones por WhatsApp.
          </span>
          <span className="text-sm leading-snug text-slate-400">
            Opcional. Puedes pedir que dejemos de escribirte cuando quieras.
          </span>
        </span>
      </label>

      {bannerText && (
        <div className="flex items-start gap-2.5 border-t-2 border-red-500 bg-red-500/[0.14] px-3.5 py-3 text-[15px] text-red-300">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="mt-px flex-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{bannerText}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex h-14 w-full items-center justify-between bg-brand-orange px-[18px] font-extrabold text-brand-navy transition-colors hover:bg-brand-orange-300 active:bg-brand-orange-600 disabled:cursor-not-allowed disabled:opacity-80"
      >
        <span>{busy ? 'Registrando…' : 'Registrarme'}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>

      <div className="flex flex-col border-t-2 border-brand-ink/20">
        <BenefitRow border>
          <ReceiptIcon />
          <span>Historial y comprobante de tus reparaciones por WhatsApp</span>
        </BenefitRow>
        <BenefitRow border>
          <DiscountIcon />
          <span>Descuentos en micas, protectores y baterías</span>
        </BenefitRow>
        <BenefitRow border>
          <BellIcon />
          <span>Avisos del estado de tu reparación</span>
        </BenefitRow>
        <BenefitRow>
          <ShieldIcon />
          <span>Sin spam: solo tus órdenes y beneficios</span>
        </BenefitRow>
      </div>
    </form>
  );
}

function BenefitRow({ border, children }) {
  return (
    <div
      className={
        'flex items-center gap-3 py-3 text-[15px] ' +
        (border ? 'border-b border-brand-ink/10' : '')
      }
    >
      {children}
    </div>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  className: 'flex-none text-brand-orange-300',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function ReceiptIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </svg>
  );
}

function DiscountIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
