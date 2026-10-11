import { Chip } from '../../shared/ui/index.js';

/** Category filter chips ("Todas" + one per category) plus the "Stock bajo" toggle chip. */
export default function CategoryChips({ categories, selectedId, onSelect, lowStock, onToggleLowStock }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip active={selectedId === undefined} onClick={() => onSelect(undefined)}>
        Todas
      </Chip>
      {categories.map((category) => (
        <Chip key={category.id} active={selectedId === category.id} onClick={() => onSelect(category.id)}>
          {category.name}
        </Chip>
      ))}
      <button
        type="button"
        onClick={() => onToggleLowStock(!lowStock)}
        className={`inline-flex h-9 items-center gap-1.5 border px-3 text-sm font-semibold transition-colors ${
          lowStock ? 'border-danger bg-danger-bg text-danger-ink' : 'border-line bg-transparent text-ink hover:bg-surface'
        }`}
      >
        <span className="h-2 w-2 bg-danger" aria-hidden="true" />
        <span>Stock bajo</span>
      </button>
    </div>
  );
}
