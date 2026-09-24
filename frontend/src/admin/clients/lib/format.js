/** Formats an E.164 Peru number (`51965728013`) as `+51 965 728 013`. */
export function formatPhone(phoneE164) {
  if (!phoneE164 || phoneE164.length !== 11) {
    return phoneE164 ?? '';
  }
  const national = phoneE164.slice(2);
  return `+51 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

const LIMA_TIME_ZONE = 'America/Lima';

/** `23/09/2026 14:05` in Lima time, for table cells / detail views. */
export function formatLimaShort(isoOrDate) {
  if (!isoOrDate) return '—';
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '—';
  const formatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

/**
 * UTC bounds (`{ from, to }` ISO strings) covering the given `YYYY-MM-DD`
 * Lima calendar day, for querying `GET /community/events?from&to` (which
 * compares against `occurredAt`, stored in UTC). Lima has no DST (UTC-5).
 */
export function limaDayRangeUtc(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const from = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const EVENT_TYPE_LABELS = {
  registro: 'Registro',
  visita: 'Visita',
  registro_rechazado: 'Rechazado',
};

export const REJECT_REASON_LABELS = {
  numero_invalido: 'Número inválido',
  sin_consentimiento: 'Sin consentimiento',
};
