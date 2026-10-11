import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useCategories } from './hooks/useCategories.js';
import { useBrands } from './hooks/useBrands.js';
import { usePhones } from './hooks/usePhones.js';
import { useProducts } from './hooks/useProducts.js';
import { useProductMovements } from './hooks/useProductMovements.js';
import { useDelayedFlag } from '../shared/lib/useDelayedFlag.js';
import { useBreadcrumb } from '../shared/layout/breadcrumb.jsx';
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

/** Container for the Inventario section: product catalog + brand/phone/category management. */
export default function InventoryPage() {
  const [tab, setTab] = useState('productos');
  const [productModal, setProductModal] = useState(null); // { mode: 'create'|'edit', product? }
  const [movementsProduct, setMovementsProduct] = useState(null);
  const [pendingArchive, setPendingArchive] = useState(null);
  const [phoneBrandFilter, setPhoneBrandFilter] = useState('');

  useBreadcrumb(tab === 'catalogo' ? 'Catálogo' : null);

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
  const rangeStart = products.total === 0 ? 0 : (products.page - 1) * products.pageSize + 1;
  const rangeEnd = Math.min(products.page * products.pageSize, products.total);

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
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">Operación</span>
          <h1>Inventario</h1>
        </div>
        {tab === 'productos' && (
          <Button onClick={() => setProductModal({ mode: 'create' })}>
            <Plus size={18} strokeWidth={2.2} />
            <span>Nuevo producto</span>
          </Button>
        )}
      </div>

      <div className="flex gap-7 border-b-2 border-line">
        <button
          type="button"
          onClick={() => setTab('productos')}
          className={`-mb-0.5 border-b-[3px] pb-2.5 text-[15px] transition-colors ${
            tab === 'productos' ? 'border-accent font-bold text-ink' : 'border-transparent font-semibold text-muted hover:text-ink'
          }`}
        >
          Productos <span className="font-medium text-muted">{products.total}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('catalogo')}
          className={`-mb-0.5 border-b-[3px] pb-2.5 text-[15px] transition-colors ${
            tab === 'catalogo' ? 'border-accent font-bold text-ink' : 'border-transparent font-semibold text-muted hover:text-ink'
          }`}
        >
          Catálogo
        </button>
      </div>

      {tab === 'productos' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted opacity-60" />
              <Input
                name="product-search"
                placeholder="Buscar por celular (ej. A54) o producto..."
                value={products.searchInput}
                onChange={(e) => products.setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <CategoryChips
              categories={categories.categories}
              selectedId={products.categoryId}
              onSelect={products.setCategoryId}
              lowStock={products.lowStock}
              onToggleLowStock={products.setLowStock}
            />
            <label className="ml-auto flex items-center gap-2 text-[15px] text-ink">
              <input
                type="checkbox"
                checked={products.includeArchived}
                onChange={(e) => products.setIncludeArchived(e.target.checked)}
                className="h-[17px] w-[17px] accent-accent"
              />
              <span>Archivados</span>
            </label>
          </div>

          {products.matchedPhones.length > 0 && (
            <p className="text-sm text-muted">
              Compatibles con{' '}
              <span className="font-medium text-ink">
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
              <div className="flex items-center justify-between gap-3 text-[15px] text-muted">
                <span>
                  Mostrando {rangeStart}–{rangeEnd} de {products.total} productos
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={products.page <= 1}
                    onClick={() => products.setPage(products.page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="px-2 font-semibold text-ink">
                    Página {products.page} de {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={products.page >= totalPages}
                    onClick={() => products.setPage(products.page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
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
