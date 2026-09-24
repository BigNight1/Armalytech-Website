/**
 * Column definitions + per-viewer persisted layout (width/order) for the
 * Glide Data Grid Historial spreadsheet (T15). Persistence is `localStorage`
 * only (per browser/viewer, not synced), wrapped in try/catch since it can
 * throw or be unavailable (private browsing, blocked storage).
 */

const STORAGE_KEY = 'admin.historial.gridColumns.v1';

/** Base column order/widths — matches the backend row shape + a trailing save-status column. */
export const BASE_COLUMNS = [
  { id: 'cashIncome', title: 'Ingreso efectivo', width: 150, kind: 'money' },
  { id: 'yapeIncome', title: 'Ingreso Yape', width: 150, kind: 'money' },
  { id: 'incomeDetail', title: 'Detalle ingreso', width: 220, kind: 'text' },
  { id: 'cashExpense', title: 'Gasto efectivo', width: 150, kind: 'money' },
  { id: 'yapeExpense', title: 'Gasto Yape', width: 150, kind: 'money' },
  { id: 'expenseDetail', title: 'Detalle gasto', width: 220, kind: 'text' },
  { id: 'status', title: 'Estado', width: 90, kind: 'status' },
];

const BASE_ORDER = BASE_COLUMNS.map((c) => c.id);
const BASE_BY_ID = new Map(BASE_COLUMNS.map((c) => [c.id, c]));

function readStoredLayout() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.order) || typeof parsed.widths !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredLayout(layout) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Storage unavailable (private mode, quota, blocked) — layout just
    // won't persist across reloads; the grid still works this session.
  }
}

/** Builds the initial `GridColumn[]`, restoring any saved width/order for this viewer. */
export function loadColumnLayout() {
  const stored = readStoredLayout();
  if (!stored) return BASE_COLUMNS.map((c) => ({ ...c }));

  // Keep only ids that still exist (schema may evolve), then append any new
  // base column that isn't in the stored order yet.
  const knownOrder = stored.order.filter((id) => BASE_BY_ID.has(id));
  const missing = BASE_ORDER.filter((id) => !knownOrder.includes(id));
  const order = [...knownOrder, ...missing];

  return order.map((id) => {
    const base = BASE_BY_ID.get(id);
    const width = Number(stored.widths?.[id]);
    return { ...base, width: Number.isFinite(width) && width > 20 ? width : base.width };
  });
}

/** Persists the current column order + widths for this viewer. */
export function saveColumnLayout(columns) {
  writeStoredLayout({
    order: columns.map((c) => c.id),
    widths: Object.fromEntries(columns.map((c) => [c.id, c.width])),
  });
}
