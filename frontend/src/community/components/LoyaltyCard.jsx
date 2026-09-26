/**
 * ArmalyTech Club loyalty card (design source of truth: `design/Rediseño de
 * registro de usuario/Panel Admin Rediseño.dc.html`, `/registrar/usuario`
 * board, `regScreen()`). 5 stamps: 1-4 read "Visita N", the 5th is the 20%
 * reward slot (dashed outline until earned, filled with a star once it is).
 */
export default function LoyaltyCard({ stamps, tagLabel, tagActive, footText }) {
  return (
    <div className="border-2 border-brand-ink bg-brand-navy">
      <div className="flex items-center justify-between border-b-2 border-brand-ink/20 px-3.5 py-3">
        <span className="text-sm font-extrabold uppercase tracking-wider text-white">
          ArmalyTech Club
        </span>
        <span
          className={
            'px-2 py-0.5 text-[13px] font-extrabold uppercase tracking-wider ' +
            (tagActive
              ? 'bg-brand-orange text-brand-navy'
              : 'border border-brand-ink/30 text-slate-300')
          }
        >
          {tagLabel}
        </span>
      </div>
      <div className="grid grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = stamps >= i;
          const isTarget = i === 5;
          return (
            <div
              key={i}
              className={
                'flex h-[78px] flex-col items-center justify-center gap-1.5 ' +
                (i < 5 ? 'border-r border-brand-ink/20 ' : '') +
                (filled
                  ? 'bg-brand-orange text-brand-navy'
                  : isTarget
                    ? 'outline outline-2 outline-dashed outline-brand-orange -outline-offset-[6px] text-brand-orange-300'
                    : 'text-slate-400')
              }
            >
              <span className="text-[22px] font-extrabold leading-none">
                {filled ? (isTarget ? '★' : '✓') : i}
              </span>
              <span className="text-[13px] font-semibold">
                {isTarget ? '20%' : `Visita ${i}`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t-2 border-brand-ink/20 px-3.5 py-2.5 text-sm leading-snug text-slate-300">
        {footText}
      </div>
    </div>
  );
}
