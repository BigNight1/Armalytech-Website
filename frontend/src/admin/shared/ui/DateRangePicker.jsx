import { useCallback, useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { useClosePopover } from './useClosePopover.js';
import { dayPickerClassNames } from './DatePicker.jsx';
import { isoToLocalDate, localDateToIso } from '../lib/dateIso.js';
import { todayInLima } from '../lib/time.js';

/** `{ from: '2026-09-01', to: '2026-09-23' } -> '01/09/2026 - 23/09/2026'`. */
function formatDisplay(range) {
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (!range?.from) return 'Elegir rango';
  const from = isoToLocalDate(range.from).toLocaleDateString('es-PE', opts);
  if (!range.to || range.to === range.from) return from;
  const to = isoToLocalDate(range.to).toLocaleDateString('es-PE', opts);
  return `${from} - ${to}`;
}

/**
 * Date-range popover picker (T16), used by Clientes > Actividad: same
 * Spanish/Monday-start/brand styling as `DatePicker`, disabled after
 * `maxDate` (defaults to "today in Lima"), closes on outside click/Escape.
 */
export default function DateRangePicker({ value, onChange, maxDate, label, className = '' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverId = useId();

  const close = useCallback(() => setOpen(false), []);
  useClosePopover(containerRef, open, close);

  const effectiveMax = maxDate ?? todayInLima();

  const selectedRange = {
    from: isoToLocalDate(value?.from),
    to: isoToLocalDate(value?.to),
  };

  const handleSelect = (range) => {
    onChange({
      from: localDateToIso(range?.from) ?? value?.from,
      to: localDateToIso(range?.to) ?? value?.to,
    });
    // Keep the popover open until both ends of the range are picked.
    if (range?.from && range?.to) setOpen(false);
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
          aria-label={label ?? 'Elegir rango de fechas'}
          className="absolute z-20 mt-2 rounded-lg border border-slate-700 shadow-xl"
        >
          <DayPicker
            mode="range"
            autoFocus
            locale={es}
            weekStartsOn={1}
            numberOfMonths={2}
            selected={selectedRange}
            onSelect={handleSelect}
            disabled={{ after: isoToLocalDate(effectiveMax) }}
            classNames={dayPickerClassNames}
          />
        </div>
      )}
    </div>
  );
}
