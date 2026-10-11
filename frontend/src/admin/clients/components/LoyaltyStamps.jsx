/**
 * 5-stamp loyalty progress for the ArmalyTech client program: visualizes
 * progress towards the 20% discount on the 5th visit (design: `smallStamps`
 * for the table row, the larger per-stamp grid for the client detail
 * drawer).
 */
export default function LoyaltyStamps({ stamps = 0, size = 'sm', showLabel = true }) {
  const currentStamps = Math.max(0, Math.min(5, Number(stamps) || 0));
  const isRewardReady = currentStamps >= 5;
  const isThreshold = currentStamps === 4;

  if (size === 'lg' || size === 'md') {
    return (
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((num) => {
          const isFilled = currentStamps >= num;
          const isTarget = num === 5;
          const cellClass =
            isTarget && isFilled
              ? 'bg-ink text-accent'
              : isFilled
              ? 'bg-accent text-on-accent'
              : isTarget
              ? 'border-2 border-dashed border-accent text-accent-ink'
              : 'border border-line text-muted';

          return (
            <div
              key={num}
              className={`flex h-[76px] flex-col items-center justify-center gap-1 ${cellClass}`}
              title={isTarget ? '5ta visita: ¡20% de descuento!' : `Visita ${num}`}
            >
              <span className="text-[22px] font-extrabold leading-none">
                {isTarget ? (isFilled ? '★' : '5') : isFilled ? '✓' : num}
              </span>
              <span className="text-[13px] font-semibold">{isTarget ? '20%' : `Visita ${num}`}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Small size for the Clientes table row.
  return (
    <div className="flex items-center gap-2" title={`Progreso: ${currentStamps} de 5 sellos`}>
      <div className="flex items-center gap-[3px]">
        {[1, 2, 3, 4, 5].map((num) => {
          const isFilled = currentStamps >= num;
          const isTarget = num === 5;
          const cellClass =
            isTarget && isFilled
              ? 'bg-ink text-accent'
              : isFilled
              ? 'bg-accent text-on-accent'
              : isTarget
              ? 'border border-dashed border-accent text-accent-ink'
              : 'border border-line text-muted';

          return (
            <span
              key={num}
              className={`flex h-5 w-5 items-center justify-center text-[11px] font-extrabold ${cellClass}`}
            >
              {isTarget ? (isFilled ? '★' : '5') : isFilled ? '✓' : num}
            </span>
          );
        })}
      </div>
      {showLabel && (
        <span className={`whitespace-nowrap text-sm ${isRewardReady || isThreshold ? 'font-extrabold text-accent-ink' : 'font-medium text-muted'}`}>
          {isRewardReady ? '20% OFF' : isThreshold ? '¡A 1 visita!' : `${currentStamps}/5`}
        </span>
      )}
    </div>
  );
}
