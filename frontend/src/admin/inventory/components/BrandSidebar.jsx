import { Button, EmptyState, Spinner } from '../../shared/ui/index.js';

/**
 * Brand navigation column (desktop app's left "MARCAS" list). Presentational
 * only: selection, add/edit/delete are all forwarded via props.
 */
export default function BrandSidebar({
  brands,
  isLoading,
  selectedBrandId,
  onSelectBrand,
  onAddBrand,
  onEditBrand,
  onDeleteBrand,
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-slate-800 bg-brand-navy-light p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Marcas</h2>
        <Button variant="primary" className="px-3 py-1 text-xs" onClick={onAddBrand}>
          + Marca
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : brands.length === 0 ? (
        <EmptyState title="Sin marcas" description="Crea tu primera marca para empezar." />
      ) : (
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {brands.map((brand) => {
            const isActive = brand.id === selectedBrandId;
            return (
              <li key={brand.id}>
                <div
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-brand-orange text-white' : 'text-brand-ink hover:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBrand(brand.id)}
                    className="min-w-0 flex-1 truncate text-left"
                  >
                    {brand.name}
                  </button>
                  <span className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      aria-label={`Editar ${brand.name}`}
                      onClick={() => onEditBrand(brand)}
                      className={isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-brand-ink'}
                    >
                      &#9998;
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar ${brand.name}`}
                      onClick={() => onDeleteBrand(brand)}
                      className={isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-400'}
                    >
                      &#10005;
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
