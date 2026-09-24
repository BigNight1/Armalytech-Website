/**
 * Column order for the Historial spreadsheet grid, matching the backend row
 * shape (`{ cashIncome, yapeIncome, incomeDetail, cashExpense, yapeExpense,
 * expenseDetail }`) and the field order ported from the desktop app's
 * `CierreDeDiaGrid`. Keyboard navigation (Tab/Enter/arrows) walks this list.
 */
export const FIELDS = [
  'cashIncome',
  'yapeIncome',
  'incomeDetail',
  'cashExpense',
  'yapeExpense',
  'expenseDetail',
];

const NUMERIC_FIELDS = new Set(['cashIncome', 'yapeIncome', 'cashExpense', 'yapeExpense']);
const TEXT_FIELDS = new Set(['incomeDetail', 'expenseDetail']);

export function isNumericField(field) {
  return NUMERIC_FIELDS.has(field);
}

export function isTextField(field) {
  return TEXT_FIELDS.has(field);
}

/**
 * Strict numeric parse for money cells (T15 paste/edit validation): accepts
 * plain numbers, optional `S/`/`s/` prefix and thousands separators, rejects
 * anything else (letters, multiple dots, empty). Returns `null` when invalid
 * so callers can distinguish "not a number" from a valid `0`.
 */
export function parseStrictMoney(value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed === '') return 0;
  const cleaned = trimmed.replace(/^s\/\s*/i, '').replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export const COLUMN_LABELS = {
  cashIncome: 'Ingreso efectivo',
  yapeIncome: 'Ingreso Yape',
  incomeDetail: 'Detalle ingreso',
  cashExpense: 'Gasto efectivo',
  yapeExpense: 'Gasto Yape',
  expenseDetail: 'Detalle gasto',
};
