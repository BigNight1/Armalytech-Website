import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { DatePicker } from '../../shared/ui/index.js';
import { formatDateLabel, formatDayOfWeek } from '../lib/dateRange.js';

/**
 * Day picker for the Historial grid: prev/next arrows, a native date input,
 * and a "Hoy" badge — mirrors the desktop `CierreDeDia` header without MUI.
 */
export default function DateNav({ selectedDate, isToday, maxDate, onPrevDay, onNextDay, onPickDate }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 bg-brand-navy-light/60 px-4 py-3">
      <button
        type="button"
        onClick={onPrevDay}
        className="rounded-md p-1.5 text-brand-ink hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
        aria-label="Día anterior"
      >
        <FiChevronLeft size={18} />
      </button>

      <div className="flex flex-col items-center leading-tight">
        <span className="text-xs uppercase tracking-wide text-slate-400">{formatDayOfWeek(selectedDate)}</span>
        <span className="text-sm font-semibold text-brand-ink">{formatDateLabel(selectedDate)}</span>
        <span className="h-4 text-[10px] font-semibold uppercase text-brand-orange">{isToday ? 'Hoy' : ' '}</span>
      </div>

      <button
        type="button"
        onClick={onNextDay}
        disabled={isToday}
        className="rounded-md p-1.5 text-brand-ink hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
        aria-label="Día siguiente"
      >
        <FiChevronRight size={18} />
      </button>

      <DatePicker
        className="ml-auto"
        value={selectedDate}
        maxDate={maxDate}
        onChange={onPickDate}
      />
    </div>
  );
}
