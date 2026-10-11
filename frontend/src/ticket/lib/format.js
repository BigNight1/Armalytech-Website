/** Formats an ISO date string as "08 set · 10:24 a. m." (es-PE), or null when missing/invalid. */
export function formatFecha(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const datePart = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' })
    .format(date)
    .replace('.', '');
  const timePart = new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true }).format(
    date,
  );
  return `${datePart} · ${timePart}`;
}

/** Formats a Peruvian Sol amount as "S/ 189.00". */
export function formatSoles(amount) {
  const value = Number(amount) || 0;
  return `S/ ${value.toFixed(2)}`;
}

/** Latest `fecha` recorded for a given `estado` inside `historialEstados`. */
export function fechaDeEstado(historialEstados, estado) {
  if (!Array.isArray(historialEstados)) return undefined;
  const entries = historialEstados.filter((h) => h?.estado === estado);
  if (entries.length === 0) return undefined;
  return entries[entries.length - 1].fecha;
}
