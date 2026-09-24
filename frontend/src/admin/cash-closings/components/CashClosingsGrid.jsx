import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataEditor, GridCellKind } from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { formatPEN } from '../../shared/lib/money.js';
import { parseStrictMoney } from '../lib/fields.js';
import { loadColumnLayout, saveColumnLayout } from '../lib/columnLayout.js';
import { gridTheme, rowThemeOverride } from '../lib/gridTheme.js';

const SAVE_DEBOUNCE_MS = 400;
const GRID_HEIGHT = 480;

const STATUS_SYMBOL = { saving: '…', saved: '✓', error: '⚠' };
const STATUS_COLOR = { saving: '#94a3b8', saved: '#4ade80', error: '#f87171' };

/** Tracks the container's own width so the grid never causes page-level horizontal scroll (T15). */
function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
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
export default function CashClosingsGrid({ rows, rowStatus, onCellChange, onCellCommit, onAddRow, onDeleteRow }) {
  const [columns, setColumns] = useState(() => loadColumnLayout());
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

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const getCellContent = useCallback(
    ([col, row]) => {
      const column = columns[col];
      const dataRow = rows[row];
      if (!column || !dataRow) {
        return { kind: GridCellKind.Text, data: '', displayData: '', allowOverlay: false };
      }

      if (column.kind === 'status') {
        const status = rowStatus[dataRow.rowIndex];
        const symbol = STATUS_SYMBOL[status] ?? '';
        return {
          kind: GridCellKind.Text,
          data: symbol,
          displayData: symbol,
          allowOverlay: false,
          readonly: true,
          contentAlign: 'center',
          themeOverride: status && STATUS_COLOR[status] ? { textDark: STATUS_COLOR[status] } : undefined,
        };
      }

      if (column.kind === 'money') {
        const value = parseStrictMoney(dataRow[column.id]) ?? 0;
        return {
          kind: GridCellKind.Number,
          data: dataRow[column.id] === '' ? undefined : value,
          displayData: dataRow[column.id] === '' ? '' : formatPEN(value),
          allowOverlay: true,
          contentAlign: 'right',
        };
      }

      const text = dataRow[column.id] ?? '';
      return { kind: GridCellKind.Text, data: text, displayData: text, allowOverlay: true };
    },
    [columns, rows, rowStatus],
  );

  const applyEdit = useCallback(
    (col, row, newValue) => {
      const column = columns[col];
      const dataRow = rows[row];
      if (!column || !dataRow || column.kind === 'status') return;

      if (column.kind === 'money') {
        const parsed = newValue.kind === GridCellKind.Number ? newValue.data : parseStrictMoney(newValue.data);
        if (parsed === null || parsed === undefined) return; // invalid input, ignore
        onCellChange(dataRow.rowIndex, column.id, String(parsed));
      } else {
        onCellChange(dataRow.rowIndex, column.id, newValue.data ?? '');
      }
      scheduleSave(dataRow.rowIndex);
    },
    [columns, rows, onCellChange, scheduleSave],
  );

  const onCellEdited = useCallback(([col, row], newValue) => applyEdit(col, row, newValue), [applyEdit]);

  const onCellsEdited = useCallback(
    (edits) => {
      edits.forEach(({ location, value }) => applyEdit(location[0], location[1], value));
      return true; // handled — don't also fire onCellEdited per cell
    },
    [applyEdit],
  );

  /** Rejects a pasted value that isn't a valid number for a money column (T15). */
  const coercePasteValue = useCallback(
    (val, cell) => {
      if (cell.kind !== GridCellKind.Number) return undefined;
      const parsed = parseStrictMoney(val);
      if (parsed === null) return cell; // invalid — keep the cell unchanged
      return { ...cell, data: parsed, displayData: formatPEN(parsed) };
    },
    [],
  );

  const onColumnResize = useCallback((column, newSize, colIndex) => {
    setColumns((current) => {
      const updated = [...current];
      updated[colIndex] = { ...updated[colIndex], width: newSize };
      return updated;
    });
  }, []);

  const onColumnResizeEnd = useCallback(() => {
    setColumns((current) => {
      saveColumnLayout(current);
      return current;
    });
  }, []);

  const onColumnMoved = useCallback((startIndex, endIndex) => {
    setColumns((current) => {
      const updated = [...current];
      const [moved] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, moved);
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

  const onRowAppended = useCallback(async () => {
    onAddRow();
    return 'bottom';
  }, [onAddRow]);

  const getRowThemeOverride = useCallback(
    (row) => rowThemeOverride(rowStatus[rows[row]?.rowIndex]),
    [rows, rowStatus],
  );

  const gridColumns = useMemo(
    () => columns.map((c) => ({ id: c.id, title: c.title, width: c.width })),
    [columns],
  );

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-lg border border-slate-700">
      <DataEditor
        getCellContent={getCellContent}
        columns={gridColumns}
        rows={rows.length}
        width={containerWidth}
        height={GRID_HEIGHT}
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
        onRowAppended={onRowAppended}
        trailingRowOptions={{ sticky: true, tint: true, hint: '+ filas' }}
        minColumnWidth={70}
        maxColumnWidth={480}
        smoothScrollX
        smoothScrollY
      />
    </div>
  );
}
