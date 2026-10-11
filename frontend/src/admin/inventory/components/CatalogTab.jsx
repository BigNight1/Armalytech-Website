import CatalogPanel from './CatalogPanel.jsx';
import PhonesPanel from './PhonesPanel.jsx';

/** Catálogo tab: Marcas, Celulares, Categorías — each with list/create/rename/delete. */
export default function CatalogTab({
  brands,
  categories,
  phones,
  isLoadingBrands,
  isLoadingCategories,
  isLoadingPhones,
  phoneBrandFilter,
  onPhoneBrandFilterChange,
  brandActions,
  categoryActions,
  phoneActions,
}) {
  return (
    <div className="grid grid-cols-1 border-t-2 border-ink lg:grid-cols-3">
      <CatalogPanel
        title="Marcas"
        countLabel="marcas"
        itemLabel="marca"
        items={brands}
        isLoading={isLoadingBrands}
        className="lg:pr-6"
        {...brandActions}
      />
      <PhonesPanel
        brands={brands}
        phones={phones}
        isLoading={isLoadingPhones}
        brandFilter={phoneBrandFilter}
        onBrandFilterChange={onPhoneBrandFilterChange}
        className="border-t-2 border-line lg:border-l-2 lg:border-t-0 lg:px-6"
        {...phoneActions}
      />
      <CatalogPanel
        title="Categorías"
        countLabel="categorías"
        itemLabel="categoría"
        items={categories}
        isLoading={isLoadingCategories}
        className="border-t-2 border-line lg:border-l-2 lg:border-t-0 lg:pl-6"
        {...categoryActions}
      />
    </div>
  );
}
