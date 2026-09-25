import { formatPEN } from '../../shared/lib/money.js';

const HIDE_NARROW = 'hidden md:table-cell';

function StockCell({ product, onAdjust }) {
  const isLow = product.stock <= product.minStock;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!product.active || product.stock <= 0}
          onClick={() => onAdjust(product.id, -1)}
          aria-label={`Restar stock a ${product.name}`}
          className="flex h-6 w-6 items-center justify-center rounded border border-slate-700 text-sm leading-none text-brand-ink hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center font-semibold">{product.stock}</span>
        <button
          type="button"
          disabled={!product.active}
          onClick={() => onAdjust(product.id, 1)}
          aria-label={`Sumar stock a ${product.name}`}
          className="flex h-6 w-6 items-center justify-center rounded border border-slate-700 text-sm leading-none text-brand-ink hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>
      {isLow && (
        <span className="inline-flex w-fit items-center rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
          Stock bajo
        </span>
      )}
    </div>
  );
}

function CompatiblePhones({ phones }) {
  if (!phones || phones.length === 0) {
    return <span className="text-slate-500">—</span>;
  }
  const shown = phones.slice(0, 3);
  const rest = phones.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((phone) => (
        <span
          key={phone.id}
          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300"
        >
          {phone.brandName} {phone.name}
        </span>
      ))}
      {rest > 0 && <span className="text-[11px] text-slate-500">+{rest}</span>}
    </div>
  );
}

function ProductRow({ product, onEdit, onMovements, onArchive, onRestore, onAdjust }) {
  const profit = product.salePrice - product.cost;
  return (
    <tr className={`text-brand-ink transition-colors ${product.active ? 'hover:bg-slate-800/60' : 'opacity-50'}`}>
      <td className="px-4 py-3">
        <div className="font-medium">{product.name}</div>
        <div className="text-xs text-slate-400">
          {[product.brand?.name, product.model].filter(Boolean).join(' · ') || '—'}
        </div>
      </td>
      <td className="px-4 py-3">{product.category.name}</td>
      <td className={`px-4 py-3 ${HIDE_NARROW}`}>
        <CompatiblePhones phones={product.compatiblePhones} />
      </td>
      <td className="px-4 py-3">
        <StockCell product={product} onAdjust={onAdjust} />
      </td>
      <td className={`px-4 py-3 ${HIDE_NARROW}`}>{formatPEN(product.cost)}</td>
      <td className="px-4 py-3">{formatPEN(product.salePrice)}</td>
      <td className={`px-4 py-3 ${HIDE_NARROW} ${profit < 0 ? 'text-red-400' : 'text-green-400'}`}>
        {formatPEN(profit)}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {product.active ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onEdit(product)} className="text-xs font-medium text-brand-orange hover:underline">
              Editar
            </button>
            <button type="button" onClick={() => onMovements(product)} className="text-xs font-medium text-slate-300 hover:underline">
              Movimientos
            </button>
            <button type="button" onClick={() => onArchive(product)} className="text-xs font-medium text-red-400 hover:underline">
              Archivar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => onRestore(product)} className="text-xs font-medium text-brand-orange hover:underline">
            Restaurar
          </button>
        )}
      </td>
    </tr>
  );
}

const HEAD_CELLS = [
  { key: 'name', label: 'Producto' },
  { key: 'category', label: 'Categoría' },
  { key: 'phones', label: 'Compatible con', hidden: true },
  { key: 'stock', label: 'Stock' },
  { key: 'cost', label: 'Costo', hidden: true },
  { key: 'price', label: 'Precio' },
  { key: 'profit', label: 'Ganancia', hidden: true },
  { key: 'actions', label: '', right: true },
];

function TableHead() {
  return (
    <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
      <tr>
        {HEAD_CELLS.map((cell) => (
          <th
            key={cell.key}
            className={`px-4 py-3 ${cell.hidden ? HIDE_NARROW : ''} ${cell.right ? 'text-right' : ''}`}
          >
            {cell.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/**
 * Product table. When `groups` is given (a phone-name search matched
 * compatible phones), renders one heading + count per category group
 * instead of a flat body.
 */
export default function ProductTable({ products, groups, ...rowActions }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="min-w-full divide-y divide-slate-700 text-sm">
        <TableHead />
        {groups ? (
          groups.map((group) => (
            <tbody key={group.categoryId} className="divide-y divide-slate-800">
              <tr className="bg-slate-900/40">
                <td colSpan={HEAD_CELLS.length} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.categoryName} <span className="font-normal text-slate-500">({group.products.length})</span>
                </td>
              </tr>
              {group.products.map((product) => (
                <ProductRow key={product.id} product={product} {...rowActions} />
              ))}
            </tbody>
          ))
        ) : (
          <tbody className="divide-y divide-slate-800">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} {...rowActions} />
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}
