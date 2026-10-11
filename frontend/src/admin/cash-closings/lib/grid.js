/**
 * Pure, framework-free helpers for the Historial spreadsheet grid: building
 * rows from the API shape, cell navigation, and row math. Kept separate from
 * React so they're trivially testable and reusable between the container and
 * the presentational grid.
 */
import { FIELDS } from './fields.js';

export const DEFAULT_ROW_COUNT = 15;
export const ADD_ROW_COUNT = 5;

/** An empty editable row at the given spreadsheet position. */
export function emptyRow(rowIndex) {
  return {
    rowIndex,
    cashIncome: '',
    yapeIncome: '',
    incomeDetail: '',
    cashExpense: '',
    yapeExpense: '',
    expenseDetail: '',
  };
}

/** True when every editable field of a grid row is empty. */
export function isBlankRow(row) {
  return ['cashIncome', 'yapeIncome', 'incomeDetail', 'cashExpense', 'yapeExpense', 'expenseDetail'].every(
    (field) => !row[field],
  );
}

/** Backend row (numbers) -> editable grid row (strings, `0` shown as blank). */
export function fromApiRow(apiRow) {
  return {
    rowIndex: apiRow.rowIndex,
    cashIncome: apiRow.cashIncome ? String(apiRow.cashIncome) : '',
    yapeIncome: apiRow.yapeIncome ? String(apiRow.yapeIncome) : '',
    incomeDetail: apiRow.incomeDetail ?? '',
    cashExpense: apiRow.cashExpense ? String(apiRow.cashExpense) : '',
    yapeExpense: apiRow.yapeExpense ? String(apiRow.yapeExpense) : '',
    expenseDetail: apiRow.expenseDetail ?? '',
  };
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Editable grid row -> the PUT body the backend contract expects. */
export function toApiPayload(row) {
  return {
    cashIncome: toNumber(row.cashIncome),
    yapeIncome: toNumber(row.yapeIncome),
    incomeDetail: row.incomeDetail ?? '',
    cashExpense: toNumber(row.cashExpense),
    yapeExpense: toNumber(row.yapeExpense),
    expenseDetail: row.expenseDetail ?? '',
  };
}

/**
 * Merges the rows returned for a date into a dense grid of at least
 * `minRows`, filling any gap (including past the last saved rowIndex) with
 * empty editable rows — same behavior as the desktop `CierreDeDia` loader.
 */
export function buildGridRows(apiRows, minRows = DEFAULT_ROW_COUNT) {
  if (!apiRows || apiRows.length === 0) {
    return Array.from({ length: minRows }, (_, i) => emptyRow(i));
  }

  const gridRows = apiRows.map(fromApiRow);
  const maxIndex = Math.max(...gridRows.map((r) => r.rowIndex), -1);
  const count = Math.max(minRows, maxIndex + 1);
  const byIndex = new Map(gridRows.map((r) => [r.rowIndex, r]));
  return Array.from({ length: count }, (_, i) => byIndex.get(i) ?? emptyRow(i));
}

/** Appends `count` more empty rows at the end ("N filas más"). */
export function appendRows(rows, count = ADD_ROW_COUNT) {
  const nextIndex = rows.length;
  return [...rows, ...Array.from({ length: count }, (_, i) => emptyRow(nextIndex + i))];
}

/** Appends exactly one empty row (used by the Glide grid's trailing row, T15). */
export function appendRow(rows) {
  return appendRows(rows, 1);
}

/**
 * Deletes a single row from the grid:
 * - If the total number of rows is greater than `minRows` (default 15),
 *   it removes ONLY that specific row and re-indexes the remaining rows.
 * - If the grid is at or below `minRows`, it simply resets the row to empty
 *   so the table maintains its default 15 rows.
 */
export function removeGridRow(rows, rowIndexToDelete, minRows = DEFAULT_ROW_COUNT) {
  if (rows.length <= minRows) {
    return rows.map((r) => (r.rowIndex === rowIndexToDelete ? emptyRow(rowIndexToDelete) : r));
  }
  const filtered = rows.filter((r) => r.rowIndex !== rowIndexToDelete);
  return filtered.map((r, idx) => ({ ...r, rowIndex: idx }));
}

/** The next cell in reading order (left-to-right, wraps to the next row). */
export function getNextCell(rowIndex, field, rowCount) {
  const idx = FIELDS.indexOf(field);
  if (idx < FIELDS.length - 1) {
    return { rowIndex, field: FIELDS[idx + 1] };
  }
  if (rowIndex < rowCount - 1) {
    return { rowIndex: rowIndex + 1, field: FIELDS[0] };
  }
  return null;
}

/** The previous cell in reading order (mirror of `getNextCell`). */
export function getPrevCell(rowIndex, field) {
  const idx = FIELDS.indexOf(field);
  if (idx > 0) {
    return { rowIndex, field: FIELDS[idx - 1] };
  }
  if (rowIndex > 0) {
    return { rowIndex: rowIndex - 1, field: FIELDS[FIELDS.length - 1] };
  }
  return null;
}

/** The cell directly below/above in the same column, if any. */
export function getCellBelow(rowIndex, field, rowCount) {
  return rowIndex < rowCount - 1 ? { rowIndex: rowIndex + 1, field } : null;
}

export function getCellAbove(rowIndex, field) {
  return rowIndex > 0 ? { rowIndex: rowIndex - 1, field } : null;
}

/** The cell to the right/left in the same row, if any. */
export function getCellRight(rowIndex, field) {
  const idx = FIELDS.indexOf(field);
  return idx < FIELDS.length - 1 ? { rowIndex, field: FIELDS[idx + 1] } : null;
}

export function getCellLeft(rowIndex, field) {
  const idx = FIELDS.indexOf(field);
  return idx > 0 ? { rowIndex, field: FIELDS[idx - 1] } : null;
}
