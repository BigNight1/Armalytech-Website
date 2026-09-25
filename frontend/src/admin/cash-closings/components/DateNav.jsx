import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DatePicker } from '../../shared/ui/index.js';

/**
 * Day picker for the Historial grid: prev/next arrows, a popover date picker,
 * and a "Hoy" badge in one bordered bar (design: `Historial de caja`'s
 * header-right control) — mirrors the desktop `CierreDeDia` header.
 */
export default function DateNav({ selectedDate, isToday, maxDate, onPrevDay, onNextDay, onPickDate }) {
  return (
    <div className="flex items-stretch self-start border border-line">
      <button
        type="button"
        onClick={onPrevDay}
        aria-label="Día anterior"
        className="flex w-11 items-center justify-center border-r border-line text-ink hover:text-accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ChevronLeft size={18} />
      </button>

      <DatePicker value={selectedDate} maxDate={maxDate} onChange={onPickDate} align="end" />

      {isToday && (
        <span className="flex items-center bg-accent px-3 text-[13px] font-extrabold uppercase tracking-[0.1em] text-on-accent">
          Hoy
        </span>
      )}

      <button
        type="button"
        onClick={onNextDay}
        disabled={isToday}
        aria-label="Día siguiente"
        className="flex w-11 items-center justify-center border-l border-line text-ink hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-[0.35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
