/** Money formatting helpers for Peruvian soles (S/), shared across the panel. */

/** `12.5 -> "S/ 12.50"`. Non-finite input is treated as zero. */
export function formatPEN(amount) {
  const value = Number(amount);
  const safeValue = Number.isFinite(value) ? value : 0;
  return `S/ ${safeValue.toFixed(2)}`;
}

/** `"S/ 1,250.50" -> 1250.5`. Strips currency symbols/thousands separators. */
export function parseMoney(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value ?? '')
    .replace(/[^0-9.,-]/g, '')
    .replace(/,/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}
