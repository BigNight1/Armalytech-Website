import { useEffect, useState } from 'react';
import { EmptyState, Spinner } from '../../shared/ui/index.js';
import { formatPEN } from '../../shared/lib/money.js';

function EditableCell({ value, onCommit, type = 'text', align = 'left' }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    if (draft !== String(value)) {
      onCommit(draft);
    }
  };

  return (
    <input
      type={type}
      inputMode={type === 'number' ? 'decimal' : undefined}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      className={`w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-brand-ink hover:border-slate-700 focus:border-brand-orange focus:bg-slate-900 focus:outline-none ${
        align === 'right' ? 'text-right' : ''
      }`}
    />
  );
}

/** Editable parts table for the selected model (desktop app's PartTable). */
export default function PartTable({
  modelName,
  parts,
  isLoading,
  onUpdatePart,
  onAdjustQuantity,
  onDeletePart,
  onAddPart,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Repuestos{modelName ? ` — ${modelName}` : ''}
        </h2>
        <button
          type="button"
          onClick={onAddPart}
          className="rounded-lg bg-brand-orange px-3 py-1 text-xs font-medium text-white hover:bg-brand-orange-600"
        >
          + Repuesto
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : parts.length === 0 ? (
        <EmptyState title="Sin repuestos" description='Haz clic en "+ Repuesto" para agregar uno.' />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-brand-navy-light text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Precio compra</th>
                <th className="px-3 py-2">Precio venta</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.id} className="border-t border-slate-800">
                  <td className="px-1 py-1">
                    <EditableCell value={part.name} onCommit={(value) => onUpdatePart(part.id, { name: value.trim() })} />
                  </td>
                  <td className="px-1 py-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Restar stock"
                        onClick={() => onAdjustQuantity(part.id, -1)}
                        disabled={part.quantity <= 0}
                        className="h-7 w-7 shrink-0 rounded-md border border-slate-700 text-brand-ink hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        &minus;
                      </button>
                      <div className="w-14">
                        <EditableCell
                          value={part.quantity}
                          type="number"
                          align="right"
                          onCommit={(value) =>
                            onUpdatePart(part.id, { quantity: Math.max(0, Number.parseInt(value, 10) || 0) })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        aria-label="Sumar stock"
                        onClick={() => onAdjustQuantity(part.id, 1)}
                        className="h-7 w-7 shrink-0 rounded-md border border-slate-700 text-brand-ink hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    <EditableCell
                      value={part.purchasePrice}
                      type="number"
                      align="right"
                      onCommit={(value) => onUpdatePart(part.id, { purchasePrice: Number.parseFloat(value) || 0 })}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <EditableCell
                      value={part.salePrice}
                      type="number"
                      align="right"
                      onCommit={(value) => onUpdatePart(part.id, { salePrice: Number.parseFloat(value) || 0 })}
                    />
                  </td>
                  <td className="px-3 py-1 text-right text-xs text-slate-400">
                    <span className="mr-3 hidden sm:inline">{formatPEN(part.salePrice)}</span>
                    <button
                      type="button"
                      aria-label={`Eliminar ${part.name}`}
                      onClick={() => onDeletePart(part)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
