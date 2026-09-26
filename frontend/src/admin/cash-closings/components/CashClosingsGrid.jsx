import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataEditor, GridCellKind } from "@glideapps/glide-data-grid";
import { Lock, Plus } from "lucide-react";
import "@glideapps/glide-data-grid/dist/index.css";
import "./cashClosingsGrid.css";
import { formatPEN } from "../../shared/lib/money.js";
import { Button, ConfirmDialog } from "../../shared/ui/index.js";
import { useTheme } from "../../shared/theme/ThemeProvider.jsx";
import { parseStrictMoney } from "../lib/fields.js";
import {
  FIXED_TRAILING_COLUMNS,
  loadColumnLayout,
  saveColumnLayout,
} from "../lib/columnLayout.js";
import { buildGridTheme, buildGetGroupDetails, buildRowThemeOverride } from "../lib/gridTheme.js";
import { buildCobroDetail, cobroAmountFor } from "../lib/cobroRows.js";

const SAVE_DEBOUNCE_MS = 400;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 38;
const GROUP_HEADER_HEIGHT = 32;
const MAX_GRID_HEIGHT = 640;
// Money columns whose totals-row cell reads straight from `totals` (design's
// "Total" row) — text columns (`incomeDetail`/`expenseDetail`) and the
// trailing `actions` column are handled separately, see `getCellContent`.
const TOTALS_MONEY_FIELDS = new Set(["cashIncome", "yapeIncome", "cashExpense", "yapeExpense"]);

const STATUS_SYMBOL = { saving: "…", saved: "✓", error: "⚠" };
const STATUS_COLOR = { saving: "#94a3b8", saved: "#4ade80", error: "#f87171" };

/** Tracks the container's own width so the grid never causes page-level horizontal scroll (T15). */
function useContainerWidth() {
  const ref = useRef(null);
  // `null` until the first measurement, so the canvas never paints at a
  // placeholder width and then jumps.
  const [width, setWidth] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.max(280, Math.floor(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

/**
 * The "tipo Excel" spreadsheet grid on Glide Data Grid (T15): resizable and
 * movable columns (persisted per viewer in localStorage), range selection,
 * copy/paste and fill-handle compatible with Excel, and a trailing row to
 * add more. Presentational — all data and persistence live in
 * `useCashClosingsGrid`; this component only translates grid events into
 * `onCellChange`/`onCellCommit`/`onAddRow`/`onDeleteRow` calls.
 */
export default function CashClosingsGrid({
  rows,
  rowStatus,
  totals,
  cobros = [],
  isOwner = false,
  onAnularRequest,
  onCobroSelect,
  onCellChange,
  onCellCommit,
  onAddRow,
  onDeleteRow,
}) {
  const { theme, isDark } = useTheme();
  const [movableColumns, setMovableColumns] = useState(() =>
    loadColumnLayout(),
  );
  const [pendingDeleteRow, setPendingDeleteRow] = useState(null);
  const columns = useMemo(
    () => [...movableColumns, ...FIXED_TRAILING_COLUMNS],
    [movableColumns],
  );
  const [containerRef, containerWidth] = useContainerWidth();

  // Glide draws on canvas, so it can't read CSS variables — rebuild its
  // theme objects from the JS token mirror whenever the admin theme flips
  // (light/dark, R2c).
  const theGridTheme = useMemo(() => buildGridTheme(theme), [theme]);
  const getGroupDetails = useMemo(() => buildGetGroupDetails(theme), [theme]);
  const rowThemeOverride = useMemo(() => buildRowThemeOverride(theme), [theme]);

  // Locked ticket-cobro and sale rows (T-C3, Fase D) are rendered at the top
  // so the day's real transactions are immediately visible without scrolling,
  // followed by the editable manual rows and the synthetic totals row.
  const cobroRows = useMemo(
    () => [...cobros].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
    [cobros],
  );
  const cobroCount = cobroRows.length;
  const manualRowCount = rows.length;
  const totalsRowIndex = cobroCount + manualRowCount;

  // Debounce saves so a paste/fill touching many cells triggers one save per
  // row instead of one PUT per keystroke/cell.
  const pendingRowsRef = useRef(new Set());
  const timerRef = useRef(null);

  const scheduleSave = useCallback(
    (rowIndex) => {
      pendingRowsRef.current.add(rowIndex);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const touched = pendingRowsRef.current;
        pendingRowsRef.current = new Set();
        touched.forEach((idx) => onCellCommit(idx));
      }, SAVE_DEBOUNCE_MS);
    },
    [onCellCommit],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const getCellContent = useCallback(
    ([col, row]) => {
      const column = columns[col];
      if (!column) {
        return {
          kind: GridCellKind.Text,
          data: "",
          displayData: "",
          allowOverlay: false,
        };
      }

      // Synthetic last row (design's bold "Total" row) — read-only, driven
      // by `totals` instead of a real data row.
      if (row === totalsRowIndex) {
        if (column.kind === "actions") {
          return {
            kind: GridCellKind.Text,
            data: "",
            displayData: "",
            allowOverlay: false,
            readonly: true,
          };
        }
        if (column.id === "incomeDetail") {
          return {
            kind: GridCellKind.Text,
            data: "Total",
            displayData: "TOTAL",
            allowOverlay: false,
            readonly: true,
          };
        }
        if (column.id === "expenseDetail") {
          return {
            kind: GridCellKind.Text,
            data: "",
            displayData: "",
            allowOverlay: false,
            readonly: true,
          };
        }
        const value = TOTALS_MONEY_FIELDS.has(column.id) ? (totals?.[column.id] ?? 0) : 0;
        return {
          kind: GridCellKind.Number,
          data: value,
          displayData: formatPEN(value),
          allowOverlay: false,
          readonly: true,
          contentAlign: "right",
        };
      }

      // Locked ticket-cobro and sale rows (T-C3, Fase D) rendered at top
      if (row < cobroCount) {
        const cobro = cobroRows[row];
        if (!cobro) {
          return { kind: GridCellKind.Text, data: "", displayData: "", allowOverlay: false, readonly: true };
        }

        if (column.kind === "actions") {
          const clickable = isOwner && !cobro.anulado;
          return {
            kind: GridCellKind.Text,
            data: "",
            displayData: "🔒",
            allowOverlay: false,
            readonly: true,
            contentAlign: "center",
            cursor: clickable ? "pointer" : "not-allowed",
            themeOverride: { textDark: isDark ? "#fdba74" : "#c2410c" },
          };
        }

        if (column.id === "incomeDetail") {
          const detail = buildCobroDetail(cobro);
          return {
            kind: GridCellKind.Text,
            data: detail,
            displayData: detail,
            allowOverlay: false,
            readonly: true,
            cursor: "pointer",
            ...(cobro.anulado ? {} : { themeOverride: { textDark: isDark ? "#fdba74" : "#c2410c" } }),
          };
        }

        if (column.id === "expenseDetail") {
          return { kind: GridCellKind.Text, data: "", displayData: "", allowOverlay: false, readonly: true };
        }

        if (column.kind === "money") {
          const amount = cobroAmountFor(cobro, column.id);
          return {
            kind: GridCellKind.Number,
            data: amount === "" ? undefined : amount,
            displayData: amount === "" ? "" : formatPEN(amount),
            allowOverlay: false,
            readonly: true,
            cursor: "pointer",
            contentAlign: "right",
          };
        }

        return { kind: GridCellKind.Text, data: "", displayData: "", allowOverlay: false, readonly: true };
      }

      const manualIndex = row - cobroCount;
      const dataRow = rows[manualIndex];
      if (!dataRow) {
        return {
          kind: GridCellKind.Text,
          data: "",
          displayData: "",
          allowOverlay: false,
        };
      }

      if (column.kind === "actions") {
        const status = rowStatus[dataRow.rowIndex];
        if (status === "saving") {
          return {
            kind: GridCellKind.Text,
            data: STATUS_SYMBOL.saving,
            displayData: STATUS_SYMBOL.saving,
            allowOverlay: false,
            readonly: true,
            contentAlign: "center",
            themeOverride: { textDark: STATUS_COLOR.saving },
          };
        }
        if (status === "saved") {
          return {
            kind: GridCellKind.Text,
            data: STATUS_SYMBOL.saved,
            displayData: STATUS_SYMBOL.saved,
            allowOverlay: false,
            readonly: true,
            contentAlign: "center",
            themeOverride: { textDark: STATUS_COLOR.saved },
          };
        }
        if (status === "error") {
          return {
            kind: GridCellKind.Text,
            data: STATUS_SYMBOL.error,
            displayData: STATUS_SYMBOL.error,
            allowOverlay: false,
            readonly: true,
            contentAlign: "center",
            cursor: "pointer",
            themeOverride: { textDark: STATUS_COLOR.error },
          };
        }
        return {
          kind: GridCellKind.Text,
          data: "",
          displayData: "🗑",
          allowOverlay: false,
          readonly: true,
          contentAlign: "center",
          cursor: "pointer",
          themeOverride: { textDark: isDark ? "#cbd5e1" : "#64748b" },
        };
      }

      if (column.kind === "money") {
        const value = parseStrictMoney(dataRow[column.id]) ?? 0;
        return {
          kind: GridCellKind.Number,
          data: dataRow[column.id] === "" ? undefined : value,
          displayData: dataRow[column.id] === "" ? "" : formatPEN(value),
          allowOverlay: true,
          contentAlign: "right",
        };
      }

      const text = dataRow[column.id] ?? "";
      return {
        kind: GridCellKind.Text,
        data: text,
        displayData: text,
        allowOverlay: true,
      };
    },
    [columns, rows, rowStatus, totals, totalsRowIndex, manualRowCount, cobroRows, isOwner, isDark],
  );

  const applyEdit = useCallback(
    (col, row, newValue) => {
      if (row < cobroCount || row === totalsRowIndex) return;
      const column = columns[col];
      const dataRow = rows[row - cobroCount];
      if (
        !column ||
        !dataRow ||
        column.kind === "actions"
      )
        return;

      if (column.kind === "money") {
        const raw = newValue.data;
        // Delete/Backspace sends an empty Number cell: clear it instead of
        // treating it as invalid input.
        if (raw === undefined || raw === null || raw === "") {
          onCellChange(dataRow.rowIndex, column.id, "");
        } else {
          const parsed =
            newValue.kind === GridCellKind.Number ? raw : parseStrictMoney(raw);
          if (parsed === null || parsed === undefined || Number.isNaN(parsed))
            return; // invalid input, ignore
          onCellChange(dataRow.rowIndex, column.id, String(parsed));
        }
      } else {
        onCellChange(dataRow.rowIndex, column.id, newValue.data ?? "");
      }
      scheduleSave(dataRow.rowIndex);
    },
    [columns, rows, cobroCount, totalsRowIndex, onCellChange, scheduleSave],
  );

  const onCellEdited = useCallback(
    ([col, row], newValue) => applyEdit(col, row, newValue),
    [applyEdit],
  );

  const onCellsEdited = useCallback(
    (edits) => {
      edits.forEach(({ location, value }) =>
        applyEdit(location[0], location[1], value),
      );
      return true; // handled — don't also fire onCellEdited per cell
    },
    [applyEdit],
  );

  /** Rejects a pasted value that isn't a valid number for a money column (T15). */
  const coercePasteValue = useCallback((val, cell) => {
    if (cell.kind !== GridCellKind.Number) return undefined;
    const parsed = parseStrictMoney(val);
    if (parsed === null) return cell; // invalid — keep the cell unchanged
    return { ...cell, data: parsed, displayData: formatPEN(parsed) };
  }, []);

  const onColumnResize = useCallback((column, newSize, colIndex) => {
    setMovableColumns((current) => {
      if (colIndex >= current.length) return current; // fixed trailing columns
      const updated = [...current];
      updated[colIndex] = { ...updated[colIndex], width: newSize };
      return updated;
    });
  }, []);

  const onColumnResizeEnd = useCallback(() => {
    setMovableColumns((current) => {
      saveColumnLayout(current);
      return current;
    });
  }, []);

  const onColumnMoved = useCallback((startIndex, endIndex) => {
    setMovableColumns((current) => {
      // Status/actions stay pinned at the end.
      if (startIndex >= current.length) return current;
      const target = Math.min(endIndex, current.length - 1);
      const updated = [...current];
      const [moved] = updated.splice(startIndex, 1);
      updated.splice(target, 0, moved);
      saveColumnLayout(updated);
      return updated;
    });
  }, []);

  const onDelete = useCallback(
    (selection) => {
      const selectedRows = selection.rows.toArray();
      if (selectedRows.length > 0) {
        selectedRows.forEach((rowIndex) => {
          if (rowIndex >= cobroCount && rowIndex < totalsRowIndex) {
            const dataRow = rows[rowIndex - cobroCount];
            if (dataRow) onDeleteRow(dataRow.rowIndex);
          }
        });
        return false; // handled ourselves
      }
      return true; // let the grid clear the selected cells' contents
    },
    [rows, onDeleteRow, cobroCount, totalsRowIndex],
  );

  const onCellClicked = useCallback(
    ([col, row]) => {
      // Locked ticket-cobro or sale row (rendered at the top):
      if (row < cobroCount) {
        const cobro = cobroRows[row];
        if (!cobro) return;

        if (columns[col]?.kind === "actions") {
          if (isOwner && !cobro.anulado) {
            onAnularRequest?.(cobro);
          } else {
            onCobroSelect?.(cobro);
          }
          return;
        }

        // Clicking on any cell of the cobro/sale row opens the full detail
        onCobroSelect?.(cobro);
        return;
      }

      if (row === totalsRowIndex) return;

      const manualIndex = row - cobroCount;
      const dataRow = rows[manualIndex];
      if (!dataRow) return;

      if (columns[col]?.kind !== "actions") return;

      if (rowStatus[dataRow.rowIndex] === "saving") return;
      setPendingDeleteRow(dataRow.rowIndex);
    },
    [columns, rows, rowStatus, cobroCount, totalsRowIndex, cobroRows, isOwner, onAnularRequest, onCobroSelect],
  );

  const confirmDelete = useCallback(() => {
    if (pendingDeleteRow !== null) onDeleteRow(pendingDeleteRow);
    setPendingDeleteRow(null);
  }, [pendingDeleteRow, onDeleteRow]);

  const getRowThemeOverride = useCallback(
    (row) => {
      if (row === totalsRowIndex) return rowThemeOverride(undefined, { isTotals: true });
      if (row < cobroCount) {
        const cobro = cobroRows[row];
        return rowThemeOverride(undefined, { isLocked: true, isAnnulled: cobro?.anulado });
      }
      const manualIndex = row - cobroCount;
      return rowThemeOverride(rowStatus[rows[manualIndex]?.rowIndex]);
    },
    [rows, rowStatus, rowThemeOverride, totalsRowIndex, cobroCount, cobroRows],
  );

  const gridColumns = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        title: c.title,
        width: c.width,
        grow: c.grow,
        group: c.group,
      })),
    [columns],
  );

  // Fit the content (group band + header + data rows + the locked cobro
  // rows + the synthetic totals row) so short days don't leave an empty
  // block under the grid; long days scroll inside it. Adding rows is now
  // the external "+ Agregar fila" button below (design), not Glide's own
  // trailing/sticky row — the design places a real "Total" row last inside
  // the grid instead.
  const gridHeight = Math.min(
    GROUP_HEADER_HEIGHT + HEADER_HEIGHT + (totalsRowIndex + 1) * ROW_HEIGHT + 2,
    MAX_GRID_HEIGHT,
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        ref={containerRef}
        className="historial-grid w-full min-w-0 overflow-hidden border-2 border-ink"
        style={{ colorScheme: isDark ? "dark" : "light" }}
      >
        {containerWidth === null ? (
          <div style={{ height: gridHeight }} />
        ) : (
          <DataEditor
            getCellContent={getCellContent}
            columns={gridColumns}
            rows={totalsRowIndex + 1}
            width={containerWidth}
            height={gridHeight}
            rowHeight={ROW_HEIGHT}
            headerHeight={HEADER_HEIGHT}
            groupHeaderHeight={GROUP_HEADER_HEIGHT}
            theme={theGridTheme}
            getGroupDetails={getGroupDetails}
            getRowThemeOverride={getRowThemeOverride}
            rowMarkers="number"
            rowSelect="multi"
            rangeSelect="rect"
            fillHandle
            keybindings={{ copy: true, paste: true, selectAll: true }}
            getCellsForSelection
            coercePasteValue={coercePasteValue}
            onCellEdited={onCellEdited}
            onCellsEdited={onCellsEdited}
            onColumnResize={onColumnResize}
            onColumnResizeEnd={onColumnResizeEnd}
            onColumnMoved={onColumnMoved}
            onDelete={onDelete}
            onCellClicked={onCellClicked}
            minColumnWidth={70}
            maxColumnWidth={480}
            smoothScrollX
            smoothScrollY
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={onAddRow}>
          <Plus size={17} />
          <span>Agregar fila</span>
        </Button>
        <span className="text-sm text-muted">
          Tab, Enter o flechas para moverte · pega directo desde Excel
        </span>
      </div>

      <div className="flex items-start gap-2.5 bg-surface p-3 text-[15px] leading-normal">
        <Lock size={18} className="mt-0.5 flex-none text-accent-ink" />
        <span>
          Las filas con candado vienen de tickets: se crean solas al cobrar un adelanto o un saldo y no se editan
          aquí. Para corregirlas, abre el ticket.
        </span>
      </div>

      <ConfirmDialog
        open={pendingDeleteRow !== null}
        title="Eliminar fila"
        message={
          pendingDeleteRow !== null
            ? `¿Eliminar los datos de la fila ${pendingDeleteRow + 1}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteRow(null)}
      />
    </div>
  );
}
