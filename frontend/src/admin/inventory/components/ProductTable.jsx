import { Archive, History, Minus, Pencil, Plus } from 'lucide-react';
import { formatPEN } from '../../shared/lib/money.js';
import { Button, Tag } from '../../shared/ui/index.js';

const HIDE_NARROW = 'hidden md:table-cell';

function StockCell({ product, onAdjust }) {
  const isLow = product.stock <= product.minStock;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center border border-line">
        <button
          type="button"
          disabled={!product.active || product.stock <= 0}
          onClick={() => onAdjust(product.id, -1)}
          aria-label={`Restar stock a ${product.name}`}
          className="flex h-[30px] w-[30px] items-center justify-center text-ink hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={14} strokeWidth={2.4} />
        </button>
        <span className="w-9 border-x border-line text-center font-extrabold tabular-nums">{product.stock}</span>
        <button
          type="button"
          disabled={!product.active}
          onClick={() => onAdjust(product.id, 1)}
          aria-label={`Sumar stock a ${product.name}`}
          className="flex h-[30px] w-[30px] items-center justify-center text-ink hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={14} strokeWidth={2.4} />
        </button>
      </div>
      {isLow && (
        <Tag variant="danger" className="whitespace-nowrap">
          Bajo
        </Tag>
      )}
    </div>
  );
}

function CompatiblePhones({ phones }) {
  if (!phones || phones.length === 0) {
    return <span className="text-muted">—</span>;
  }
  const shown = phones.slice(0, 2);
  const rest = phones.length - shown.length;
  return (
    <div className="flex max-w-[220px] flex-wrap gap-1">
      {shown.map((phone) => (
        <Tag key={phone.id} variant="neutral" className="whitespace-nowrap normal-case tracking-normal">
          {phone.brandName} {phone.name}
        </Tag>
      ))}
      {rest > 0 && <span className="py-0.5 text-xs text-muted">+{rest}</span>}
    </div>
  );
}

function ProductRow({ product, onEdit, onMovements, onArchive, onRestore, onAdjust }) {
  const profit = product.salePrice - product.cost;
  return (
    <tr className={product.active ? '' : 'opacity-55'}>
      <td>
        <div className="font-bold">{product.name}</div>
        <div className="text-sm text-muted">
          {[product.brand?.name, product.model].filter(Boolean).join(' · ') || '—'}
        </div>
      </td>
      <td>{product.category.name}</td>
      <td className={HIDE_NARROW}>
        <CompatiblePhones phones={product.compatiblePhones} />
      </td>
      <td>
        <StockCell product={product} onAdjust={onAdjust} />
      </td>
      <td className={`${HIDE_NARROW} whitespace-nowrap text-right tabular-nums text-muted`}>{formatPEN(product.cost)}</td>
      <td className="whitespace-nowrap text-right font-bold tabular-nums">{formatPEN(product.salePrice)}</td>
      <td
        className={`${HIDE_NARROW} whitespace-nowrap text-right font-bold tabular-nums ${
          profit < 0 ? 'text-danger-ink' : 'text-ink'
        }`}
      >
        {formatPEN(profit)}
      </td>
      <td className="text-right">
        {product.active ? (
          <div className="flex justify-end gap-1">
            <Button variant="icon" title="Editar" aria-label={`Editar ${product.name}`} onClick={() => onEdit(product)}>
              <Pencil size={16} />
            </Button>
            <Button variant="icon" title="Movimientos" aria-label={`Movimientos de ${product.name}`} onClick={() => onMovements(product)}>
              <History size={16} />
            </Button>
            <button
              type="button"
              title="Archivar"
              aria-label={`Archivar ${product.name}`}
              onClick={() => onArchive(product)}
              className="flex h-9 w-9 items-center justify-center border border-line p-0 text-ink transition-colors hover:border-danger hover:text-danger-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Archive size={16} />
            </button>
          </div>
        ) : (
          <Button variant="secondary" className="ml-auto" onClick={() => onRestore(product)}>
            Restaurar
          </Button>
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
  { key: 'cost', label: 'Costo', hidden: true, right: true },
  { key: 'price', label: 'Precio', right: true },
  { key: 'profit', label: 'Ganancia', hidden: true, right: true },
  { key: 'actions', label: 'Acciones', right: true },
];

function TableHead() {
  return (
    <thead>
      <tr>
        {HEAD_CELLS.map((cell) => (
          <th key={cell.key} className={`${cell.hidden ? HIDE_NARROW : ''} ${cell.right ? 'text-right' : ''}`}>
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
    <div className="overflow-x-auto border-t-2 border-ink">
      <table className="admin-table">
        <TableHead />
        {groups ? (
          groups.map((group) => (
            <tbody key={group.categoryId}>
              <tr>
                <td colSpan={HEAD_CELLS.length} className="bg-surface text-xs font-bold uppercase tracking-wide text-muted">
                  {group.categoryName} <span className="font-medium text-muted">({group.products.length})</span>
                </td>
              </tr>
              {group.products.map((product) => (
                <ProductRow key={product.id} product={product} {...rowActions} />
              ))}
            </tbody>
          ))
        ) : (
          <tbody>
            {products.map((product) => (
              <ProductRow key={product.id} product={product} {...rowActions} />
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}
