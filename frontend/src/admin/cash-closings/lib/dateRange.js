/**
 * Pure calendar-date helpers for the Historial grid's date nav and the
 * week/month resumen ranges. Ported from the desktop app's `CierreDeDia`.
 * Dates are plain `YYYY-MM-DD` strings — no timezone conversion here; the
 * caller supplies "today" via `todayInLima()` (see shared/lib/time.js).
 */

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
];

/** Parses a `YYYY-MM-DD` string at noon local time (avoids DST/UTC edge shifts). */
function parseISO(iso) {
  return new Date(`${iso}T12:00:00`);
}

/** `Date` -> `YYYY-MM-DD` in local calendar terms. */
export function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** `addDays('2026-09-23', -1) -> '2026-09-22'`. */
export function addDays(iso, delta) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + delta);
  return toISO(date);
}

/** Monday-Sunday range (ISO week) containing `iso`. */
export function getWeekRange(iso) {
  const date = parseISO(iso);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toISO(monday), end: toISO(sunday) };
}

/** First-to-last-day-of-month range containing `iso`. */
export function getMonthRange(iso) {
  const date = parseISO(iso);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toISO(start), end: toISO(end) };
}

/** `'23 de septiembre de 2026' -> 'Miércoles'`. */
export function formatDayOfWeek(iso) {
  return DAY_NAMES[parseISO(iso).getDay()];
}

/** `'2026-09-23' -> '23 Sep 2026'`. */
export function formatDateLabel(iso) {
  const date = parseISO(iso);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

/** `'2026-09-23' -> '21 Sep - 27 Sep'` (label for the resumen week tab). */
export function formatWeekLabel(iso) {
  const { start, end } = getWeekRange(iso);
  const a = parseISO(start);
  const b = parseISO(end);
  return `${a.getDate()} ${MONTH_NAMES[a.getMonth()].slice(0, 3)} - ${b.getDate()} ${MONTH_NAMES[b.getMonth()].slice(0, 3)}`;
}

/** `'2026-09-23' -> 'Septiembre 2026'` (label for the resumen month tab). */
export function formatMonthLabel(iso) {
  const date = parseISO(iso);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}
