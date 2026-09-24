import { EmptyState, Spinner } from '../../shared/ui/index.js';
import { formatPEN } from '../../shared/lib/money.js';

/** Cross-collection search results (`GET /inventory/search`); click jumps to that part's model. */
export default function SearchResults({ query, results, isLoading, onSelectResult }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  if (results.length === 0) {
    return <EmptyState title="Sin resultados" description={`No se encontraron repuestos para "${query}".`} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para "{query}"
      </h2>
      <ul className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800">
        {results.map((result) => (
          <li key={result.id}>
            <button
              type="button"
              onClick={() => onSelectResult(result)}
              className="flex w-full flex-wrap items-center justify-between gap-2 bg-brand-navy-light px-4 py-3 text-left text-sm hover:bg-slate-800"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-brand-ink">{result.name}</span>
                <span className="block truncate text-xs text-slate-400">
                  {result.brandName} &rsaquo; {result.modelName}
                </span>
              </span>
              <span className="shrink-0 text-xs text-slate-300">
                Stock: {result.quantity} &middot; {formatPEN(result.salePrice)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
