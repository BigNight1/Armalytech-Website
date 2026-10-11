import { useEffect, useState } from 'react';
import { formatLimaDateTime } from '../../shared/lib/time.js';

/**
 * Presentational: login screen's left brand panel — logo, headline, and the
 * Hora Lima / Fecha / Tienda strip. Collapses to a compact top band below
 * `lg` (see `LoginPage.jsx`'s responsive wrapper).
 */
export default function LoginBrandPanel() {
  const [now, setNow] = useState(() => formatLimaDateTime());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(formatLimaDateTime()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-none flex-col gap-6 bg-side-bg px-6 py-6 text-side-ink sm:px-10 lg:w-7/12 lg:justify-between lg:gap-0 lg:p-12">
      <div className="flex items-center gap-3.5">
        <img src="/Armalytech_logo.png" alt="ArmalyTech" className="h-10 w-10 object-contain lg:h-12 lg:w-12" />
        <span className="text-lg font-extrabold tracking-tight text-white lg:text-[22px]">ArmalyTech</span>
      </div>

      <div className="hidden flex-col gap-6 lg:flex">
        <span className="text-sm font-bold uppercase tracking-[0.16em] text-accent-300">Uso interno</span>
        <h1 className="m-0 text-[72px] font-extrabold leading-[0.92] tracking-[-0.035em] text-white xl:text-[112px]">
          Panel de
          <br />
          adminis-
          <br />
          tración
          <span className="text-accent-500">.</span>
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4 border-t-2 border-accent-500 pt-3 sm:gap-6 lg:pt-[18px]">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-side-muted sm:text-[13px]">
            Hora Lima
          </span>
          <span className="font-mono text-base font-semibold text-white sm:text-2xl">{now.time}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-side-muted sm:text-[13px]">
            Fecha
          </span>
          <span className="truncate text-sm font-semibold capitalize text-white sm:text-base">{now.date}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-side-muted sm:text-[13px]">
            Tienda
          </span>
          <span className="text-sm font-semibold text-white sm:text-base">San Borja, Lima</span>
        </div>
      </div>
    </div>
  );
}
