import React from 'react';

/**
 * 5-Stamp Loyalty Component for ArmalyTech Client Program.
 * Visualizes progress towards the 20% discount on the 5th visit.
 */
export default function LoyaltyStamps({ stamps = 0, size = 'sm', showLabel = true }) {
  const currentStamps = Math.max(0, Math.min(5, Number(stamps) || 0));
  const isRewardReady = currentStamps >= 5;
  const isThreshold = currentStamps === 4;

  if (size === 'lg' || size === 'md') {
    return (
      <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-slate-700/80 bg-slate-900/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Programa de Fidelización
            </span>
            {isRewardReady ? (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                ¡20% OFF Desbloqueado!
              </span>
            ) : isThreshold ? (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                ¡A 1 visita del premio!
              </span>
            ) : null}
          </div>
          <span className="text-xs font-bold text-brand-ink">
            {currentStamps} / 5 sellos
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 py-1">
          {[1, 2, 3, 4, 5].map((num) => {
            const isFilled = currentStamps >= num;
            const isTarget = num === 5;

            return (
              <div
                key={num}
                className={`relative flex flex-col items-center justify-center rounded-xl transition-all duration-300 ${
                  size === 'lg' ? 'w-14 h-14' : 'w-10 h-10'
                } ${
                  isTarget && isFilled
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 ring-2 ring-amber-300 shadow-lg shadow-orange-500/40 font-black'
                    : isFilled
                    ? 'bg-brand-orange text-white shadow-md shadow-orange-500/30 font-bold'
                    : isTarget
                    ? 'border-2 border-dashed border-amber-500/50 bg-slate-800/40 text-amber-500/60'
                    : 'border border-slate-700 bg-slate-800/30 text-slate-500'
                }`}
                title={
                  isTarget
                    ? '5ta Visita: ¡20% de Descuento!'
                    : `Visita ${num}`
                }
              >
                {isTarget ? (
                  <span className={size === 'lg' ? 'text-lg' : 'text-sm'}>
                    {isFilled ? '★' : '🎁'}
                  </span>
                ) : (
                  <span className={size === 'lg' ? 'text-sm' : 'text-xs'}>
                    {isFilled ? '✓' : num}
                  </span>
                )}
                {size === 'lg' && (
                  <span className="text-[10px] opacity-80 mt-0.5">
                    {isTarget ? '20%' : `#${num}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400">
          {isRewardReady
            ? 'El cliente ha completado 5 visitas. Puede canjear su 20% de descuento en esta reparación.'
            : isThreshold
            ? 'Se ha enviado recordatorio por WhatsApp. En su próxima visita ganará 20% de descuento.'
            : 'Acumula 5 visitas de reparación o servicio para ganar 20% de descuento.'}
        </p>
      </div>
    );
  }

  // Small size for tables
  return (
    <div className="flex items-center gap-1.5" title={`Progreso: ${currentStamps} de 5 sellos`}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((num) => {
          const isFilled = currentStamps >= num;
          const isTarget = num === 5;

          return (
            <span
              key={num}
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] transition-colors ${
                isTarget && isFilled
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-xs shadow-orange-500/50 animate-pulse'
                  : isFilled
                  ? 'bg-brand-orange text-white font-bold'
                  : isTarget
                  ? 'border border-dashed border-amber-500/60 bg-slate-800/50 text-amber-500/70 text-[8px]'
                  : 'border border-slate-700 bg-slate-800/40 text-slate-600'
              }`}
            >
              {isTarget ? (isFilled ? '★' : '5') : isFilled ? '✓' : num}
            </span>
          );
        })}
      </div>
      {showLabel && (
        <span
          className={`text-xs font-medium ml-1 ${
            isRewardReady
              ? 'text-emerald-400 font-bold'
              : isThreshold
              ? 'text-orange-400 font-semibold'
              : 'text-slate-400'
          }`}
        >
          {isRewardReady ? '20% OFF' : `${currentStamps}/5`}
        </span>
      )}
    </div>
  );
}
