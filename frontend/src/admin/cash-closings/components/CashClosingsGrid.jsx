import { useEffect, useRef, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { FIELDS, COLUMN_LABELS, isNumericField, isTextField } from '../lib/fields.js';
import { getNextCell, getPrevCell, getCellBelow, getCellAbove, getCellRight, getCellLeft } from '../lib/grid.js';
import RowStatusDot from './RowStatusDot.jsx';

/**
 * The "tipo Excel" spreadsheet grid: one row per `cierre_dia` entry, inline
 * cell editing, and spreadsheet-style keyboard navigation. Presentational —
 * all data and persistence live in `useCashClosingsGrid`.
 */
export default function CashClosingsGrid({ rows, rowStatus, onCellChange, onCellCommit, onAddRows, onDeleteRow }) {
  const [active, setActive] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (active && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [active]);

  const commitAndMove = (rowIndex, next) => {
    onCellCommit(rowIndex);
    setActive(next);
  };

  const handleKeyDown = (event, rowIndex, field) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const next = event.shiftKey ? getPrevCell(rowIndex, field, rows.length) : getNextCell(rowIndex, field, rows.length);
      commitAndMove(rowIndex, next);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      commitAndMove(rowIndex, getCellBelow(rowIndex, field, rows.length));
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setActive(null);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      commitAndMove(rowIndex, getCellBelow(rowIndex, field, rows.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      commitAndMove(rowIndex, getCellAbove(rowIndex, field));
    } else if (event.key === 'ArrowRight' && event.target.selectionStart === event.target.value.length) {
      event.preventDefault();
      commitAndMove(rowIndex, getCellRight(rowIndex, field));
    } else if (event.key === 'ArrowLeft' && event.target.selectionStart === 0) {
      event.preventDefault();
      commitAndMove(rowIndex, getCellLeft(rowIndex, field));
    }
  };

  const handleBlur = (rowIndex, field) => {
    onCellCommit(rowIndex);
    setActive((current) => (current?.rowIndex === rowIndex && current?.field === field ? null : current));
  };

  const renderCell = (row, rowIndex, field) => {
    const value = row[field];
    const isActive = active?.rowIndex === rowIndex && active?.field === field;
    const numeric = isNumericField(field);
    const text = isTextField(field);

    if (isActive) {
      return (
        <input
          ref={inputRef}
          type={numeric ? 'number' : 'text'}
          step={numeric ? 'any' : undefined}
          min={numeric ? 0 : undefined}
          value={value}
          onChange={(event) => onCellChange(rowIndex, field, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, rowIndex, field)}
          onBlur={() => handleBlur(rowIndex, field)}
          className={`w-full bg-slate-900 px-2 py-1.5 text-sm text-brand-ink outline-none ring-2 ring-brand-orange ${
            numeric ? 'text-right' : ''
          } ${text ? 'min-w-[10rem]' : 'min-w-[6rem]'}`}
        />
      );
    }

    const display = value === '' || value == null ? '' : value;
    return (
      <div
        role="gridcell"
        tabIndex={-1}
        title={display}
        onClick={() => setActive({ rowIndex, field })}
        className={`cursor-text truncate px-2 py-1.5 text-sm text-brand-ink hover:bg-slate-800 ${
          numeric ? 'text-right' : ''
        } ${text ? 'min-w-[10rem]' : 'min-w-[6rem]'}`}
      >
        {display || ' '}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="bg-brand-navy-dark text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-2 py-2 text-right">#</th>
            {FIELDS.map((field) => (
              <th key={field} className="px-2 py-2 font-medium">
                {COLUMN_LABELS[field]}
              </th>
            ))}
            <th className="px-2 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.rowIndex} className="border-t border-slate-800 odd:bg-slate-900/40">
              <td className="px-2 py-1.5 text-right text-xs text-slate-500">{rowIndex + 1}</td>
              {FIELDS.map((field) => (
                <td key={field} className="border-l border-slate-800 p-0">
                  {renderCell(row, rowIndex, field)}
                </td>
              ))}
              <td className="border-l border-slate-800 px-2 py-1.5">
                <div className="flex items-center justify-end gap-2">
                  <RowStatusDot status={rowStatus[row.rowIndex]} onRetry={() => onCellCommit(row.rowIndex)} />
                  <button
                    type="button"
                    onClick={() => onDeleteRow(row.rowIndex)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                    aria-label={`Eliminar fila ${rowIndex + 1}`}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={FIELDS.length + 2} className="p-0">
              <button
                type="button"
                onClick={onAddRows}
                className="w-full border-t border-slate-800 px-3 py-2 text-center text-xs font-medium text-brand-orange hover:bg-slate-800"
              >
                + 5 filas más
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
