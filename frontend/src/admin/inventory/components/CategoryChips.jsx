function chipClass(active, activeClasses) {
  return `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    active ? activeClasses : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
  }`;
}

/** Category filter chips ("Todas" + one per category) plus the "Stock bajo" toggle chip. */
export default function CategoryChips({ categories, selectedId, onSelect, lowStock, onToggleLowStock }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={chipClass(selectedId === undefined, 'border-brand-orange bg-brand-orange text-white')}
      >
        Todas
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={chipClass(selectedId === category.id, 'border-brand-orange bg-brand-orange text-white')}
        >
          {category.name}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onToggleLowStock(!lowStock)}
        className={chipClass(lowStock, 'border-red-500 bg-red-500/20 text-red-300')}
      >
        Stock bajo
      </button>
    </div>
  );
}
