import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataEditor, GridCellKind } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import "./cashClosingsGrid.css";
import { formatPEN } from "../../shared/lib/money.js";
import { ConfirmDialog } from "../../shared/ui/index.js";
import { parseStrictMoney } from "../lib/fields.js";
import {
  FIXED_TRAILING_COLUMNS,
  loadColumnLayout,
  saveColumnLayout,
} from "../lib/columnLayout.js";
import { gridTheme, rowThemeOverride } from "../lib/gridTheme.js";

const SAVE_DEBOUNCE_MS = 400;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 38;
const MAX_GRID_HEIGHT = 640;

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
  onCellChange,
  onCellCommit,
  onAddRow,
  onDeleteRow,
}) {
  const [movableColumns, setMovableColumns] = useState(() =>
    loadColumnLayout(),
  );
  const [pendingDeleteRow, setPendingDeleteRow] = useState(null);
  const columns = useMemo(
    () => [...movableColumns, ...FIXED_TRAILING_COLUMNS],
    [movableColumns],
  );
  const [containerRef, containerWidth] = useContainerWidth();

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
      const dataRow = rows[row];
      if (!column || !dataRow) {
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
          themeOverride: { textDark: "#94a3b8" },
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
    [columns, rows, rowStatus],
  );

  const applyEdit = useCallback(
    (col, row, newValue) => {
      const column = columns[col];
      const dataRow = rows[row];
      if (
        !column ||
        !dataRow ||
        column.kind === "actions"
      )
        return;

      if (column.kind === "money") {
        const parsed =
          newValue.kind === GridCellKind.Number
            ? newValue.data
            : parseStrictMoney(newValue.data);
        if (parsed === null || parsed === undefined) return; // invalid input, ignore
        onCellChange(dataRow.rowIndex, column.id, String(parsed));
      } else {
        onCellChange(dataRow.rowIndex, column.id, newValue.data ?? "");
      }
      scheduleSave(dataRow.rowIndex);
    },
    [columns, rows, onCellChange, scheduleSave],
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
          const dataRow = rows[rowIndex];
          if (dataRow) onDeleteRow(dataRow.rowIndex);
        });
        return false; // handled ourselves
      }
      return true; // let the grid clear the selected cells' contents
    },
    [rows, onDeleteRow],
  );

  const onCellClicked = useCallback(
    ([col, row]) => {
      if (columns[col]?.kind === "actions" && rows[row]) {
        if (rowStatus[rows[row].rowIndex] === "saving") return;
        setPendingDeleteRow(rows[row].rowIndex);
      }
    },
    [columns, rows, rowStatus],
  );

  const confirmDelete = useCallback(() => {
    if (pendingDeleteRow !== null) onDeleteRow(pendingDeleteRow);
    setPendingDeleteRow(null);
  }, [pendingDeleteRow, onDeleteRow]);

  const onRowAppended = useCallback(async () => {
    onAddRow();
    return "bottom";
  }, [onAddRow]);

  const getRowThemeOverride = useCallback(
    (row) => rowThemeOverride(rowStatus[rows[row]?.rowIndex]),
    [rows, rowStatus],
  );

  const gridColumns = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        title: c.title,
        width: c.width,
        grow: c.grow,
      })),
    [columns],
  );

  // Fit the content (header + rows + trailing "add" row) so short days don't
  // leave an empty block under the grid; long days scroll inside it.
  const gridHeight = Math.min(
    HEADER_HEIGHT + (rows.length + 1) * ROW_HEIGHT + 2,
    MAX_GRID_HEIGHT,
  );

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0 overflow-hidden historial-grid rounded-lg border border-slate-700 [color-scheme:dark]"
    >
      {containerWidth === null ? (
        <div style={{ height: gridHeight }} />
      ) : (
        <DataEditor
          getCellContent={getCellContent}
          columns={gridColumns}
          rows={rows.length}
          width={containerWidth}
          height={gridHeight}
          rowHeight={ROW_HEIGHT}
          headerHeight={HEADER_HEIGHT}
          theme={gridTheme}
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
          onRowAppended={onRowAppended}
          trailingRowOptions={{
            sticky: true,
            tint: true,
            hint: "Agregar filas",
          }}
          minColumnWidth={70}
          maxColumnWidth={480}
          smoothScrollX
          smoothScrollY
        />
      )}
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
