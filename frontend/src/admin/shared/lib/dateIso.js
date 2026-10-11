/**
 * `YYYY-MM-DD` <-> local `Date` helpers shared by the admin date pickers
 * (T16). Parsing at noon local time (instead of midnight UTC) avoids the
 * classic DST/timezone off-by-one when the string round-trips through
 * `Date` — same convention already used in `cash-closings/lib/dateRange.js`.
 */

/** `'2026-09-23' -> Date` at local noon. */
export function isoToLocalDate(iso) {
  if (!iso) return undefined;
  return new Date(`${iso}T12:00:00`);
}

/** `Date -> 'YYYY-MM-DD'` in local calendar terms. */
export function localDateToIso(date) {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
