import { useCallback, useId, useRef, useState } from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { useClosePopover } from './useClosePopover.js';
import { isoToLocalDate, localDateToIso } from '../lib/dateIso.js';
import { todayInLima } from '../lib/time.js';

const defaultClassNames = getDefaultClassNames();

/**
 * Tailwind/brand overrides for `DayPicker` (T16), shared by `DatePicker` and
 * `DateRangePicker`: dark navy surface, orange selected/range days, today
 * marked with an orange ring.
 */
export const dayPickerClassNames = {
  root: `${defaultClassNames.root} bg-brand-navy-light text-brand-ink p-3 rounded-lg`,
  months: defaultClassNames.months,
  month_caption: `${defaultClassNames.month_caption} text-sm font-semibold text-brand-ink`,
  weekday: `${defaultClassNames.weekday} text-slate-400`,
  day: `${defaultClassNames.day} text-brand-ink`,
  day_button: `${defaultClassNames.day_button} hover:bg-slate-700 rounded-md`,
  today: `${defaultClassNames.today} border border-brand-orange rounded-md`,
  selected: `${defaultClassNames.selected} bg-brand-orange text-white rounded-md`,
  range_start: `${defaultClassNames.range_start} bg-brand-orange text-white rounded-l-md`,
  range_end: `${defaultClassNames.range_end} bg-brand-orange text-white rounded-r-md`,
  range_middle: `${defaultClassNames.range_middle} bg-brand-orange/25 text-brand-ink`,
  outside: `${defaultClassNames.outside} text-slate-600`,
  disabled: `${defaultClassNames.disabled} text-slate-700`,
  chevron: `${defaultClassNames.chevron} fill-brand-orange`,
  nav_button: `${defaultClassNames.nav_button ?? ''} hover:bg-slate-700 rounded-md`,
};

/** `'2026-09-23' -> '23/09/2026'` for the trigger button label. */
function formatDisplay(iso) {
  if (!iso) return 'Elegir fecha';
  const date = isoToLocalDate(iso);
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Single-date popover picker (T16): Spanish locale, week starting Monday,
 * disabled after `maxDate` (defaults to "today in Lima"), closes on outside
 * click/Escape, fully keyboard accessible (native `<button>` trigger +
 * `DayPicker`'s own roving focus).
 */
export default function DatePicker({ value, onChange, maxDate, label, className = '' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverId = useId();

  const close = useCallback(() => setOpen(false), []);
  useClosePopover(containerRef, open, close);

  const effectiveMax = maxDate ?? todayInLima();

  const handleSelect = (date) => {
    if (!date) return;
    onChange(localDateToIso(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {label && <span className="mb-1 block text-xs text-brand-ink">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-orange"
      >
        {formatDisplay(value)}
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={label ?? 'Elegir fecha'}
          className="absolute z-20 mt-2 rounded-lg border border-slate-700 shadow-xl"
        >
          <DayPicker
            mode="single"
            autoFocus
            locale={es}
            weekStartsOn={1}
            selected={isoToLocalDate(value)}
            onSelect={handleSelect}
            disabled={{ after: isoToLocalDate(effectiveMax) }}
            classNames={dayPickerClassNames}
          />
        </div>
      )}
    </div>
  );
}
