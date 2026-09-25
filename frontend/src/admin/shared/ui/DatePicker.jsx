import { useCallback, useId, useRef, useState } from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { useClosePopover } from './useClosePopover.js';
import { isoToLocalDate, localDateToIso } from '../lib/dateIso.js';
import { todayInLima } from '../lib/time.js';

const defaultClassNames = getDefaultClassNames();

/**
 * Admin token overrides for `DayPicker` (T16, restyled R1), shared by
 * `DatePicker` and `DateRangePicker`: surface background, accent
 * selected/range days, today marked with an accent ring. `chevron` and
 * `nav_button` are set explicitly (react-day-picker's own default is blue)
 * so the month-nav arrows follow the accent token instead.
 */
export const dayPickerClassNames = {
  root: `${defaultClassNames.root} bg-surface text-ink p-3`,
  months: defaultClassNames.months,
  month_caption: `${defaultClassNames.month_caption} text-sm font-semibold text-ink`,
  weekday: `${defaultClassNames.weekday} text-muted`,
  day: `${defaultClassNames.day} text-ink`,
  day_button: `${defaultClassNames.day_button} hover:bg-row-hover`,
  today: `${defaultClassNames.today} border border-accent`,
  selected: `${defaultClassNames.selected} bg-accent text-on-accent`,
  range_start: `${defaultClassNames.range_start} bg-accent text-on-accent`,
  range_end: `${defaultClassNames.range_end} bg-accent text-on-accent`,
  range_middle: `${defaultClassNames.range_middle} bg-accent-100 text-accent-900`,
  outside: `${defaultClassNames.outside} text-muted opacity-60`,
  disabled: `${defaultClassNames.disabled} text-muted opacity-40`,
  chevron: `${defaultClassNames.chevron} fill-accent`,
  nav_button: `${defaultClassNames.nav_button ?? ''} hover:bg-row-hover`,
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
export default function DatePicker({ value, onChange, maxDate, label, className = '', align = 'start' }) {
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
      {label && <span className="mb-1 block text-xs text-ink">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        className="border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus-visible:border-accent"
      >
        {formatDisplay(value)}
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={label ?? 'Elegir fecha'}
          className={`absolute z-20 mt-2 border border-line bg-bg shadow-admin-lg ${align === 'end' ? 'right-0' : 'left-0'}`}
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
