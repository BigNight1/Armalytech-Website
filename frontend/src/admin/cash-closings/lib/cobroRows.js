/**
 * Pure helpers for rendering a `GET /cobros` entry as one locked row in the
 * Historial grid (T-C3) — kept separate from `CashClosingsGrid.jsx` so the
 * text formatting is trivially testable.
 */

const TIPO_LABELS = { adelanto: 'Adelanto', saldo: 'Saldo', venta: 'Venta' };

/** `'adelanto' -> 'Adelanto'` (falls back to the raw value for an unknown tipo). */
export function cobroTipoLabel(tipo) {
  return TIPO_LABELS[tipo] ?? tipo;
}

/**
 * Fakes a strike-through in a Glide text cell (it has no `text-decoration`
 * support) by interleaving the Unicode combining long-stroke-overlay
 * character after every visible character.
 */
export function strikeThrough(text) {
  return `${text.split('').join('̶')}̶`;
}

/** `"Adelanto AT-000148"` / `"Venta · 2× Cargador Samsung"` / annulled: struck-through. */
export function buildCobroDetail(cobro) {
  let base = `${cobroTipoLabel(cobro.tipo)} ${cobro.codigo}`;
  if (cobro.tipo === 'venta' && cobro.items && cobro.items.length > 0) {
    const summary = cobro.items.map((it) => `${it.cantidad}× ${it.nombre}`).join(', ');
    base = `Venta · ${summary}`;
  }
  return cobro.anulado ? `${strikeThrough(base)} · Anulado` : base;
}

/** The `cashIncome`/`yapeIncome` amount this cobro contributes, or `''` (blank cell) otherwise. */
export function cobroAmountFor(cobro, field) {
  if (cobro.anulado) return '';
  if (field === 'cashIncome' && cobro.metodo === 'efectivo') return cobro.monto;
  if (field === 'yapeIncome' && cobro.metodo === 'yape') return cobro.monto;
  return '';
}
