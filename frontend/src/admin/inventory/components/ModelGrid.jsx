import { Button, EmptyState, Spinner } from '../../shared/ui/index.js';

/** Grid of model cards for the selected brand (desktop app's "models-grid"). */
export default function ModelGrid({
  brandName,
  models,
  isLoading,
  selectedModelId,
  onSelectModel,
  onAddModel,
  onEditModel,
  onDeleteModel,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Modelos{brandName ? ` — ${brandName}` : ''}
        </h2>
        <Button variant="secondary" className="px-3 py-1 text-xs" onClick={onAddModel}>
          + Modelo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : models.length === 0 ? (
        <EmptyState title="Sin modelos" description="Agrega un modelo para esta marca." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((model) => {
            const isActive = model.id === selectedModelId;
            return (
              <div
                key={model.id}
                className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
                  isActive
                    ? 'border-brand-orange bg-brand-orange/10'
                    : 'border-slate-800 bg-brand-navy-light hover:border-slate-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectModel(model.id)}
                  className="truncate text-left text-sm font-medium text-brand-ink"
                  title={model.name}
                >
                  {model.name}
                </button>
                <div className="flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    aria-label={`Editar ${model.name}`}
                    onClick={() => onEditModel(model)}
                    className="text-slate-400 hover:text-brand-ink"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${model.name}`}
                    onClick={() => onDeleteModel(model)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
