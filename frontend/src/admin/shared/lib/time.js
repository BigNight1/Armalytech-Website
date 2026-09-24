/**
 * Pure Peru-timezone (America/Lima) helpers, shared by the header clock and
 * by the Historial feature (which needs "today" in Lima to default its
 * date filters, per the feature doc).
 */

const LIMA_TIME_ZONE = 'America/Lima';

/** `{ date: '23 de septiembre de 2026', time: '14:05:09' }` in Lima time. */
export function formatLimaDateTime(instant = new Date()) {
  const dateFormatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return {
    date: dateFormatter.format(instant),
    time: timeFormatter.format(instant),
  };
}

/** Today's calendar date in Lima time as `YYYY-MM-DD`. */
export function todayInLima(instant = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}
