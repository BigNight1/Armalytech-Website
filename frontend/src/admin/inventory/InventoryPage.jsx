import { useMemo, useState } from 'react';
import { useCategories } from './hooks/useCategories.js';
import { useBrands } from './hooks/useBrands.js';
import { usePhones } from './hooks/usePhones.js';
import { useProducts } from './hooks/useProducts.js';
import { useProductMovements } from './hooks/useProductMovements.js';
import { useDelayedFlag } from '../shared/lib/useDelayedFlag.js';
import CategoryChips from './components/CategoryChips.jsx';
import ProductTable from './components/ProductTable.jsx';
import ProductFormModal from './components/ProductFormModal.jsx';
import MovementsModal from './components/MovementsModal.jsx';
import CatalogTab from './components/CatalogTab.jsx';
import { Button, ConfirmDialog, EmptyState, Input, SkeletonTable } from '../shared/ui/index.js';

/** Groups an already-fetched page of products by category, preserving first-seen order. */
function groupByCategory(products) {
  const order = [];
  const byCategory = new Map();
  for (const product of products) {
    const key = product.category.id;
    if (!byCategory.has(key)) {
      byCategory.set(key, { categoryId: key, categoryName: product.category.name, products: [] });
      order.push(key);
    }
    byCategory.get(key).products.push(product);
  }
  return order.map((key) => byCategory.get(key));
}

const TABS = [
  { key: 'productos', label: 'Productos' },
  { key: 'catalogo', label: 'Catálogo' },
];

/** Container for the Inventario section: product catalog + brand/phone/category management. */
export default function InventoryPage() {
  const [tab, setTab] = useState('productos');
  const [productModal, setProductModal] = useState(null); // { mode: 'create'|'edit', product? }
  const [movementsProduct, setMovementsProduct] = useState(null);
  const [pendingArchive, setPendingArchive] = useState(null);
  const [phoneBrandFilter, setPhoneBrandFilter] = useState('');

  const categories = useCategories();
  const brands = useBrands();
  const phones = usePhones();
  const products = useProducts();
  const movements = useProductMovements(movementsProduct?.id);

  // The backend returns bare `{id, brandId, name}` for phones; join brand
  // names client-side (the catalog is small) for display everywhere.
  const phonesWithBrand = useMemo(
    () =>
      phones.phones.map((phone) => ({
        ...phone,
        brandName: brands.brands.find((brand) => brand.id === phone.brandId)?.name ?? '',
      })),
    [phones.phones, brands.brands],
  );

  const filteredCatalogPhones = useMemo(
    () => (phoneBrandFilter ? phonesWithBrand.filter((phone) => phone.brandId === phoneBrandFilter) : phonesWithBrand),
    [phonesWithBrand, phoneBrandFilter],
  );

  const showProductsLoading = useDelayedFlag(products.isLoading);
  const hasProducts = products.items.length > 0;
  const hasSearchText = products.searchInput.trim().length > 0;
  const hasActiveFilters = Boolean(products.categoryId) || products.lowStock || products.includeArchived;
  const groups = products.matchedPhones.length > 0 ? groupByCategory(products.items) : null;
  const totalPages = Math.max(1, Math.ceil(products.total / products.pageSize));
  const totalMovementPages = Math.max(1, Math.ceil(movements.total / movements.pageSize));

  async function handleSubmitProduct(payload) {
    if (productModal?.mode === 'edit') {
      await products.updateProduct(productModal.product.id, payload);
    } else {
      await products.createProduct(payload);
    }
  }

  async function handleConfirmArchive() {
    if (!pendingArchive) return;
    try {
      await products.archiveProduct(pendingArchive.id);
    } finally {
      setPendingArchive(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-ink">Inventario</h1>
        {tab === 'productos' && <Button onClick={() => setProductModal({ mode: 'create' })}>+ Producto</Button>}
      </div>

      <div className="flex gap-2 border-b border-slate-700">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.key ? 'border-brand-orange text-brand-ink' : 'border-transparent text-slate-400 hover:text-brand-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'productos' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="w-full max-w-md">
              <Input
                name="product-search"
                placeholder="Buscar por celular (ej. A54) o producto..."
                value={products.searchInput}
                onChange={(e) => products.setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CategoryChips
                categories={categories.categories}
                selectedId={products.categoryId}
                onSelect={products.setCategoryId}
                lowStock={products.lowStock}
                onToggleLowStock={products.setLowStock}
              />
              <button
                type="button"
                onClick={() => products.setIncludeArchived(!products.includeArchived)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  products.includeArchived
                    ? 'border-slate-400 bg-slate-700 text-brand-ink'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                Archivados
              </button>
            </div>
          </div>

          {products.matchedPhones.length > 0 && (
            <p className="text-sm text-slate-300">
              Compatibles con{' '}
              <span className="font-medium text-brand-ink">
                {products.matchedPhones.map((phone) => `${phone.brandName} ${phone.name}`).join(', ')}
              </span>
            </p>
          )}

          {showProductsLoading ? (
            <SkeletonTable rows={6} columns={8} />
          ) : hasProducts ? (
            <>
              <ProductTable
                products={products.items}
                groups={groups}
                onEdit={(product) => setProductModal({ mode: 'edit', product })}
                onMovements={setMovementsProduct}
                onArchive={setPendingArchive}
                onRestore={(product) => products.restoreProduct(product.id)}
                onAdjust={(id, delta) => products.adjustStock(id, delta)}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
                  <button
                    type="button"
                    disabled={products.page <= 1}
                    onClick={() => products.setPage(products.page - 1)}
                    className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span>
                    Página {products.page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={products.page >= totalPages}
                    onClick={() => products.setPage(products.page + 1)}
                    className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={
                hasSearchText
                  ? `No hay productos para "${products.searchInput.trim()}"`
                  : hasActiveFilters
                    ? 'No hay productos con estos filtros'
                    : 'Todavía no hay productos'
              }
              description={
                hasSearchText || hasActiveFilters
                  ? 'Prueba con otro celular, nombre de producto o quita los filtros.'
                  : 'Crea el primer producto del inventario.'
              }
              action={
                !hasSearchText && !hasActiveFilters ? (
                  <Button onClick={() => setProductModal({ mode: 'create' })}>Nuevo producto</Button>
                ) : undefined
              }
            />
          )}
        </div>
      ) : (
        <CatalogTab
          brands={brands.brands}
          categories={categories.categories}
          phones={filteredCatalogPhones}
          isLoadingBrands={brands.isLoading}
          isLoadingCategories={categories.isLoading}
          isLoadingPhones={phones.isLoading}
          phoneBrandFilter={phoneBrandFilter}
          onPhoneBrandFilterChange={setPhoneBrandFilter}
          brandActions={{ onCreate: brands.createBrand, onRename: brands.updateBrand, onDelete: brands.deleteBrand }}
          categoryActions={{
            onCreate: categories.createCategory,
            onRename: categories.updateCategory,
            onDelete: categories.deleteCategory,
          }}
          phoneActions={{ onCreate: phones.createPhone, onRename: phones.updatePhone, onDelete: phones.deletePhone }}
        />
      )}

      <ProductFormModal
        open={Boolean(productModal)}
        mode={productModal?.mode}
        product={productModal?.product ?? null}
        categories={categories.categories}
        brands={brands.brands}
        phones={phonesWithBrand}
        onCreateBrand={brands.createBrand}
        onCreatePhone={phones.createPhone}
        onSubmit={handleSubmitProduct}
        onClose={() => setProductModal(null)}
      />

      <MovementsModal
        open={Boolean(movementsProduct)}
        product={movementsProduct}
        movements={movements.items}
        isLoading={movements.isLoading}
        page={movements.page}
        totalPages={totalMovementPages}
        onPageChange={movements.setPage}
        onClose={() => setMovementsProduct(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingArchive)}
        title="Archivar producto"
        message={pendingArchive ? `Se archivará "${pendingArchive.name}". Podrás restaurarlo desde "Archivados".` : ''}
        confirmLabel="Archivar"
        onConfirm={handleConfirmArchive}
        onCancel={() => setPendingArchive(null)}
      />
    </div>
  );
}
