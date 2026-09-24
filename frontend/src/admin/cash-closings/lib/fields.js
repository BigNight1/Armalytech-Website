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

export const COLUMN_LABELS = {
  cashIncome: 'Ingreso efectivo',
  yapeIncome: 'Ingreso Yape',
  incomeDetail: 'Detalle ingreso',
  cashExpense: 'Gasto efectivo',
  yapeExpense: 'Gasto Yape',
  expenseDetail: 'Detalle gasto',
};
