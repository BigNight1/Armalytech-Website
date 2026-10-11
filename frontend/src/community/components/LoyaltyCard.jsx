import { Check, Sparkles, Star, Wifi } from 'lucide-react';

/**
 * ArmalyTech VIP Club loyalty card.
 * Modernist digital membership wallet card design with tactile stamp slots,
 * glowing accent highlights, and contactless NFC iconography.
 */
export default function LoyaltyCard({ stamps = 0, tagLabel = '0/5', tagActive = false, footText }) {
  const percent = Math.min(100, Math.round((stamps / 5) * 100));

  return (
    <div className="relative overflow-hidden rounded-xl border border-brand-orange/40 bg-gradient-to-b from-slate-900 via-brand-navy to-slate-950 p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),0_0_20px_rgba(255,107,0,0.15)] transition-all">
      {/* Decorative ambient glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-brand-orange/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-brand-orange/10 blur-xl" />

      {/* Card Header: Brand + NFC symbol + Status Tag */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-orange/20 text-brand-orange">
            <Wifi size={15} className="rotate-90" />
          </div>
          <div>
            <div className="text-[13px] font-black uppercase tracking-wider text-white">
              ArmalyTech <span className="text-brand-orange">Club VIP</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">
              Tarjeta de Fidelización
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
            tagActive
              ? 'bg-brand-orange text-brand-navy shadow-[0_0_10px_rgba(255,107,0,0.4)]'
              : 'border border-white/20 bg-white/5 text-slate-300'
          }`}
        >
          {tagActive && <Sparkles size={11} />}
          {tagLabel}
        </span>
      </div>

      {/* Stamp Slots Grid (5 Stamps) */}
      <div className="relative z-10 my-4 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = stamps >= i;
          const isPrizeSlot = i === 5;

          return (
            <div
              key={i}
              className={`flex flex-col items-center justify-center rounded-lg p-2.5 transition-all ${
                filled
                  ? 'border border-brand-orange bg-gradient-to-t from-brand-orange to-amber-400 text-brand-navy shadow-[0_4px_12px_rgba(255,107,0,0.3)]'
                  : isPrizeSlot
                  ? 'border-2 border-dashed border-brand-orange/60 bg-brand-orange/10 text-brand-orange-300'
                  : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full">
                {filled ? (
                  isPrizeSlot ? (
                    <Star size={18} className="fill-current" />
                  ) : (
                    <Check size={18} strokeWidth={3} />
                  )
                ) : isPrizeSlot ? (
                  <Star size={16} className="text-brand-orange" />
                ) : (
                  <span className="text-sm font-bold font-mono text-slate-400">{i}</span>
                )}
              </div>
              <span
                className={`mt-1 text-[11px] font-bold ${
                  filled ? 'text-brand-navy' : isPrizeSlot ? 'text-brand-orange-300 font-extrabold' : 'text-slate-400'
                }`}
              >
                {isPrizeSlot ? '20% OFF' : `Visita ${i}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar & Footer */}
      <div className="relative z-10 space-y-2 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Progreso de visitas</span>
          <span className="font-mono font-bold text-slate-200">{stamps} de 5 completadas ({percent}%)</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-brand-orange transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-slate-300 leading-snug pt-1">
          {footText}
        </p>
      </div>
    </div>
  );
}
