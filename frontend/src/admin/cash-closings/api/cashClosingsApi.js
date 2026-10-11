import { httpClient } from '../../shared/api/httpClient.js';

/**
 * Historial (cash closings) API service — the only module in this feature
 * allowed to talk to `httpClient`. See `odd/tasks/panel-inventario-historial.md`
 * for the backend contract.
 */
export const cashClosingsApi = {
  /** Rows for `[from, to]` (`YYYY-MM-DD`, inclusive). */
  listRows(from, to) {
    return httpClient.get(`/cash-closings?from=${from}&to=${to}`);
  },

  /** Upserts one row at `(date, rowIndex)`. */
  upsertRow(date, rowIndex, payload) {
    return httpClient.put(`/cash-closings/${date}/rows/${rowIndex}`, payload);
  },

  /** Deletes one row at `(date, rowIndex)`. */
  deleteRow(date, rowIndex) {
    return httpClient.delete(`/cash-closings/${date}/rows/${rowIndex}`);
  },

  /** Grouped totals for `[from, to]`, bucketed by `day | week | month`. */
  getSummary(from, to, groupBy) {
    return httpClient.get(`/cash-closings/summary?from=${from}&to=${to}&groupBy=${groupBy}`);
  },
};
