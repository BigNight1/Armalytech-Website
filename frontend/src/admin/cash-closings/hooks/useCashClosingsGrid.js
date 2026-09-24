import { useCallback, useEffect, useRef, useState } from 'react';
import { cashClosingsApi } from '../api/cashClosingsApi.js';
import { useToast } from '../../shared/ui/index.js';
import { appendRows, buildGridRows, emptyRow, toApiPayload } from '../lib/grid.js';

/**
 * Owns the editable rows for one date: loads them, tracks per-row
 * save status, and upserts/deletes through `cashClosingsApi`.
 *
 * Save happens on cell blur (ADR 0010: non-blocking, per-row). On failure the
 * row reverts to its last known-good value and a toast reports the error.
 */
export function useCashClosingsGrid(selectedDate) {
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rowStatus, setRowStatus] = useState({});
  const [savedVersion, setSavedVersion] = useState(0);

  const rowsRef = useRef(rows);
  const lastSavedRef = useRef(new Map());

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    cashClosingsApi
      .listRows(selectedDate, selectedDate)
      .then((apiRows) => {
        if (cancelled) return;
        const gridRows = buildGridRows(apiRows);
        setRows(gridRows);
        lastSavedRef.current = new Map(gridRows.map((row) => [row.rowIndex, row]));
        setRowStatus({});
      })
      .catch((error) => {
        if (cancelled) return;
        notify(`No se pudo cargar el historial del día: ${error.message}`, { type: 'error' });
        setRows(buildGridRows([]));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, notify]);

  const updateCell = useCallback((rowIndex, field, value) => {
    setRows((current) => current.map((row) => (row.rowIndex === rowIndex ? { ...row, [field]: value } : row)));
  }, []);

  const saveRow = useCallback(
    (rowIndex) => {
      const row = rowsRef.current.find((r) => r.rowIndex === rowIndex);
      if (!row) return;

      setRowStatus((current) => ({ ...current, [rowIndex]: 'saving' }));

      cashClosingsApi
        .upsertRow(selectedDate, rowIndex, toApiPayload(row))
        .then(() => {
          lastSavedRef.current.set(rowIndex, row);
          setSavedVersion((v) => v + 1);
          setRowStatus((current) => ({ ...current, [rowIndex]: 'saved' }));
          setTimeout(() => {
            setRowStatus((current) => (current[rowIndex] === 'saved' ? { ...current, [rowIndex]: 'idle' } : current));
          }, 1500);
        })
        .catch((error) => {
          const lastGood = lastSavedRef.current.get(rowIndex) ?? emptyRow(rowIndex);
          setRows((current) => current.map((r) => (r.rowIndex === rowIndex ? lastGood : r)));
          setRowStatus((current) => ({ ...current, [rowIndex]: 'error' }));
          notify(`No se pudo guardar la fila ${rowIndex + 1}: ${error.message}`, { type: 'error' });
        });
    },
    [selectedDate, notify],
  );

  const addRows = useCallback(() => {
    setRows((current) => appendRows(current));
  }, []);

  const deleteRow = useCallback(
    (rowIndex) => {
      setRowStatus((current) => ({ ...current, [rowIndex]: 'saving' }));

      cashClosingsApi
        .deleteRow(selectedDate, rowIndex)
        .then(() => {
          const cleared = emptyRow(rowIndex);
          lastSavedRef.current.set(rowIndex, cleared);
          setRows((current) => current.map((r) => (r.rowIndex === rowIndex ? cleared : r)));
          setRowStatus((current) => ({ ...current, [rowIndex]: 'idle' }));
          setSavedVersion((v) => v + 1);
        })
        .catch((error) => {
          setRowStatus((current) => ({ ...current, [rowIndex]: 'error' }));
          notify(`No se pudo eliminar la fila ${rowIndex + 1}: ${error.message}`, { type: 'error' });
        });
    },
    [selectedDate, notify],
  );

  return { rows, isLoading, rowStatus, savedVersion, updateCell, saveRow, addRows, deleteRow };
}
