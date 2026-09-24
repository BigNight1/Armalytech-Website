import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashClosingsApi } from '../api/cashClosingsApi.js';
import { cashClosingsKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';
import { appendRow, appendRows, buildGridRows, emptyRow, isBlankRow, toApiPayload, removeGridRow } from '../lib/grid.js';

/**
 * Owns the editable rows for one date (T14: TanStack Query for the fetch;
 * local state for in-progress edits, since a spreadsheet cell mid-edit isn't
 * cache data). Tracks per-row save status and upserts/deletes through
 * `cashClosingsApi`.
 *
 * Save happens on cell blur (ADR 0010: non-blocking, per-row). On failure the
 * row reverts to its last known-good value and a toast reports the error. A
 * successful save/delete invalidates this date's rows plus every cached
 * summary range, so the resumen panel (T14: only the visible tab fetches)
 * stays in sync without a full page reload.
 */
export function useCashClosingsGrid(selectedDate) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const rowsKey = cashClosingsKeys.rows(selectedDate);

  const rowsQuery = useQuery({
    queryKey: rowsKey,
    queryFn: () => cashClosingsApi.listRows(selectedDate, selectedDate),
  });

  const [rows, setRows] = useState(() => buildGridRows([]));
  const [rowStatus, setRowStatus] = useState({});

  const rowsRef = useRef(rows);
  const lastSavedRef = useRef(new Map());
  // rowIndexes that exist in the database for this date. Blank-looking rows
  // can still be persisted (older all-zero saves), so "is it blank?" is not a
  // reliable proxy for "is there anything to delete?".
  const persistedRef = useRef(new Set());

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    if (rowsQuery.isError) {
      notify(`No se pudo cargar el historial del día: ${rowsQuery.error.message}`, { type: 'error' });
    }
    const gridRows = buildGridRows(rowsQuery.data ?? (rowsQuery.isError ? [] : undefined));
    if (rowsQuery.data !== undefined || rowsQuery.isError) {
      setRows(gridRows);
      lastSavedRef.current = new Map(gridRows.map((row) => [row.rowIndex, row]));
      persistedRef.current = new Set((rowsQuery.data ?? []).map((apiRow) => apiRow.rowIndex));
      setRowStatus({});
    }
    // Only re-seed when the query for this date settles (success or error).
  }, [rowsQuery.data, rowsQuery.isError, selectedDate]);

  const invalidateAfterWrite = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: rowsKey });
    queryClient.invalidateQueries({ queryKey: cashClosingsKeys.summaryAll() });
  }, [queryClient, rowsKey]);

  const upsertMutation = useMutation({
    mutationFn: ({ rowIndex, payload }) => cashClosingsApi.upsertRow(selectedDate, rowIndex, payload),
  });

  const deleteMutation = useMutation({
    mutationFn: (rowIndex) => cashClosingsApi.deleteRow(selectedDate, rowIndex),
  });

  const updateCell = useCallback((rowIndex, field, value) => {
    setRows((current) => current.map((row) => (row.rowIndex === rowIndex ? { ...row, [field]: value } : row)));
  }, []);

  const deleteRow = useCallback(
    (rowIndex) => {
      const cleared = emptyRow(rowIndex);
      // Nothing in the database for this row: just clear/remove it locally.
      if (!persistedRef.current.has(rowIndex)) {
        lastSavedRef.current.delete(rowIndex);
        setRows((current) => {
          const next = removeGridRow(current, rowIndex);
          lastSavedRef.current = new Map(next.map((r) => [r.rowIndex, r]));
          return next;
        });
        return;
      }

      setRowStatus((current) => ({ ...current, [rowIndex]: 'saving' }));

      deleteMutation.mutate(rowIndex, {
        onSuccess: () => {
          persistedRef.current.delete(rowIndex);
          lastSavedRef.current.delete(rowIndex);
          setRows((current) => {
            const next = removeGridRow(current, rowIndex);
            lastSavedRef.current = new Map(next.map((r) => [r.rowIndex, r]));
            return next;
          });
          setRowStatus((current) => ({ ...current, [rowIndex]: 'idle' }));
          invalidateAfterWrite();
        },
        onError: (error) => {
          setRowStatus((current) => ({ ...current, [rowIndex]: 'error' }));
          notify(`No se pudo eliminar la fila ${rowIndex + 1}: ${error.message}`, { type: 'error' });
        },
      });
    },
    [deleteMutation, invalidateAfterWrite, notify],
  );

  const saveRow = useCallback(
    (rowIndex) => {
      const row = rowsRef.current.find((r) => r.rowIndex === rowIndex);
      if (!row) return;

      // Clearing every cell of a row removes it instead of storing an empty row.
      if (isBlankRow(row)) {
        deleteRow(rowIndex);
        return;
      }

      setRowStatus((current) => ({ ...current, [rowIndex]: 'saving' }));

      upsertMutation.mutate(
        { rowIndex, payload: toApiPayload(row) },
        {
          onSuccess: () => {
            persistedRef.current.add(rowIndex);
            lastSavedRef.current.set(rowIndex, row);
            invalidateAfterWrite();
            setRowStatus((current) => ({ ...current, [rowIndex]: 'saved' }));
            setTimeout(() => {
              setRowStatus((current) =>
                current[rowIndex] === 'saved' ? { ...current, [rowIndex]: 'idle' } : current,
              );
            }, 1500);
          },
          onError: (error) => {
            const lastGood = lastSavedRef.current.get(rowIndex) ?? emptyRow(rowIndex);
            setRows((current) => current.map((r) => (r.rowIndex === rowIndex ? lastGood : r)));
            setRowStatus((current) => ({ ...current, [rowIndex]: 'error' }));
            notify(`No se pudo guardar la fila ${rowIndex + 1}: ${error.message}`, { type: 'error' });
          },
        },
      );
    },
    [upsertMutation, invalidateAfterWrite, notify, deleteRow],
  );

  const addRows = useCallback(() => {
    setRows((current) => appendRows(current));
  }, []);

  /** Adds exactly one empty row — used by the Glide grid's trailing row (T15). */
  const addRow = useCallback(() => {
    setRows((current) => appendRow(current));
  }, []);


  return {
    rows,
    isLoading: rowsQuery.isLoading,
    rowStatus,
    updateCell,
    saveRow,
    addRows,
    addRow,
    deleteRow,
  };
}
