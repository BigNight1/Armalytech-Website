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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <CatalogPanel title="Marcas" itemLabel="marca" items={brands} isLoading={isLoadingBrands} {...brandActions} />
      <PhonesPanel
        brands={brands}
        phones={phones}
        isLoading={isLoadingPhones}
        brandFilter={phoneBrandFilter}
        onBrandFilterChange={onPhoneBrandFilterChange}
        {...phoneActions}
      />
      <CatalogPanel title="Categorías" itemLabel="categoría" items={categories} isLoading={isLoadingCategories} {...categoryActions} />
    </div>
  );
}
