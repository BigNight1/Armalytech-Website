import { Link } from 'react-router-dom';

/**
 * Success / "already registered" screen (design: `isDone` branch of
 * `regScreen()`). Same layout for both outcomes, just different copy —
 * `kicker`/`title`/`text` come from RegisterPage based on `isNewClient`.
 */
export default function RegisterResult({ kicker, title, text }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-extrabold uppercase tracking-widest text-brand-orange-300">
          {kicker}
        </span>
        <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-tight text-white">
          {title}
        </h1>
        <p className="text-base leading-snug text-slate-300">{text}</p>
      </div>

      <div className="flex flex-col border-t-2 border-brand-ink/20">
        <span className="pb-1 pt-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          Cómo ganas sellos
        </span>
        <StepRow border n="01">Da tu número de WhatsApp en caja.</StepRow>
        <StepRow border n="02">Cada visita o reparación en tienda suma 1 sello.</StepRow>
        <StepRow n="03">Al 5.º sello, 20% de descuento en tu servicio.</StepRow>
      </div>

      <div className="flex flex-col gap-2.5">
        <a
          href="https://api.whatsapp.com/send/?phone=%2B51924548268"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[54px] items-center gap-3 bg-brand-orange px-[18px] font-extrabold text-brand-navy transition-colors hover:bg-brand-orange-300"
        >
          <img
            src="/redes_sociales/whatsapp.svg"
            alt=""
            className="h-[22px] w-[22px] brightness-0"
          />
          <span>Guardar contacto en WhatsApp</span>
        </a>
        <Link
          to="/"
          state={{ scrollTo: 'services' }}
          className="flex h-[52px] items-center justify-between border-2 border-brand-ink px-[18px] font-bold text-white transition-colors hover:border-brand-orange hover:text-brand-orange-300"
        >
          <span>Ver nuestros servicios</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <div className="grid grid-cols-2 gap-2.5">
          <SocialLink href="https://instagram.com/armalytech" label="Instagram" icon="/redes_sociales/instagram.svg" />
          <SocialLink href="https://tiktok.com/@armalytech" label="TikTok" icon="/redes_sociales/tik-tok.svg" />
        </div>
      </div>
    </div>
  );
}

function StepRow({ border, n, children }) {
  return (
    <div
      className={
        'flex gap-3 py-2.5 text-[15px] leading-snug ' +
        (border ? 'border-b border-brand-ink/10' : '')
      }
    >
      <span className="w-[22px] flex-none font-extrabold text-brand-orange-300">{n}</span>
      <span>{children}</span>
    </div>
  );
}

function SocialLink({ href, label, icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-[50px] items-center gap-2.5 border border-brand-ink/25 px-3.5 font-semibold text-brand-ink transition-colors hover:border-brand-orange"
    >
      <img src={icon} alt="" className="h-5 w-5 object-contain invert" />
      <span>{label}</span>
    </a>
  );
}
