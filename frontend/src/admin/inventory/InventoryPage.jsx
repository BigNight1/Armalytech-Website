import { useMemo, useState } from 'react';
import { useBrands } from './hooks/useBrands.js';
import { useModels } from './hooks/useModels.js';
import { useParts } from './hooks/useParts.js';
import { useInventorySearch } from './hooks/useInventorySearch.js';
import { useDelayedFlag } from '../shared/lib/useDelayedFlag.js';
import BrandSidebar from './components/BrandSidebar.jsx';
import ModelGrid from './components/ModelGrid.jsx';
import PartTable from './components/PartTable.jsx';
import SearchResults from './components/SearchResults.jsx';
import NameFormModal from './components/NameFormModal.jsx';
import PartFormModal from './components/PartFormModal.jsx';
import { Input, ConfirmDialog } from '../shared/ui/index.js';

/** What kind of "delete this" confirmation is pending, if any. */
function useConfirmDelete() {
  const [pending, setPending] = useState(null); // { kind: 'brand'|'model'|'part', item }
  return {
    pending,
    ask: (kind, item) => setPending({ kind, item }),
    cancel: () => setPending(null),
  };
}

/** Container for the Inventario section: brands -> models -> parts, plus search. */
export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [selectedModelId, setSelectedModelId] = useState(null);

  const [brandModal, setBrandModal] = useState(null); // { mode: 'create'|'edit', brand? }
  const [modelModal, setModelModal] = useState(null);
  const [partModal, setPartModal] = useState(null);

  const { brands, isLoading: brandsLoading, createBrand, updateBrand, deleteBrand } = useBrands();
  const { models, isLoading: modelsLoading, createModel, updateModel, deleteModel } = useModels(selectedBrandId);
  const {
    parts,
    isLoading: partsLoading,
    createPart,
    updatePart,
    deletePart,
    adjustQuantity,
  } = useParts(selectedModelId);
  const { results: searchResults, isLoading: searchLoading } = useInventorySearch(searchQuery);

  // T14: only show loading placeholders once a fetch has been pending a
  // noticeable while, so fast cache-hit navigation never flashes a skeleton.
  const showBrandsLoading = useDelayedFlag(brandsLoading);
  const showModelsLoading = useDelayedFlag(modelsLoading);
  const showPartsLoading = useDelayedFlag(partsLoading);
  const showSearchLoading = useDelayedFlag(searchLoading);

  const confirmDelete = useConfirmDelete();

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === selectedBrandId) ?? null,
    [brands, selectedBrandId],
  );
  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) ?? null,
    [models, selectedModelId],
  );

  const isSearching = searchQuery.trim().length > 0;

  const handleSelectBrand = (brandId) => {
    setSelectedBrandId(brandId);
    setSelectedModelId(null);
  };

  const handleSelectSearchResult = (result) => {
    // The search result carries brandName/modelName (not brandId — brand
    // names are unique per the backend), so resolve it against the already
    // loaded brand list before jumping the brand/model selection there.
    setSearchQuery('');
    const brand = brands.find((candidate) => candidate.name === result.brandName);
    setSelectedBrandId(brand?.id ?? null);
    setSelectedModelId(result.modelId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.pending) return;
    const { kind, item } = confirmDelete.pending;
    try {
      if (kind === 'brand') {
        await deleteBrand(item.id);
        if (selectedBrandId === item.id) handleSelectBrand(null);
      } else if (kind === 'model') {
        await deleteModel(item.id);
        if (selectedModelId === item.id) setSelectedModelId(null);
      } else if (kind === 'part') {
        await deletePart(item.id);
      }
    } finally {
      confirmDelete.cancel();
    }
  };

  const deleteMessages = {
    brand: (brand) => `Se eliminará la marca "${brand.name}" y todos sus modelos y repuestos.`,
    model: (model) => `Se eliminará el modelo "${model.name}" y todos sus repuestos.`,
    part: (part) => `Se eliminará el repuesto "${part.name}".`,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-ink">Inventario</h1>
        <div className="w-full max-w-xs">
          <Input
            name="inventory-search"
            placeholder="Buscar repuesto, modelo o marca..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      {isSearching ? (
        <SearchResults
          query={searchQuery}
          results={searchResults}
          isLoading={showSearchLoading}
          onSelectResult={handleSelectSearchResult}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
          <BrandSidebar
            brands={brands}
            isLoading={showBrandsLoading}
            selectedBrandId={selectedBrandId}
            onSelectBrand={handleSelectBrand}
            onAddBrand={() => setBrandModal({ mode: 'create' })}
            onEditBrand={(brand) => setBrandModal({ mode: 'edit', brand })}
            onDeleteBrand={(brand) => confirmDelete.ask('brand', brand)}
          />

          <div className="flex flex-col gap-6">
            {selectedBrandId ? (
              <>
                <ModelGrid
                  brandName={selectedBrand?.name}
                  models={models}
                  isLoading={showModelsLoading}
                  selectedModelId={selectedModelId}
                  onSelectModel={setSelectedModelId}
                  onAddModel={() => setModelModal({ mode: 'create' })}
                  onEditModel={(model) => setModelModal({ mode: 'edit', model })}
                  onDeleteModel={(model) => confirmDelete.ask('model', model)}
                />

                {selectedModelId && (
                  <PartTable
                    modelName={selectedModel?.name}
                    parts={parts}
                    isLoading={showPartsLoading}
                    onUpdatePart={updatePart}
                    onAdjustQuantity={adjustQuantity}
                    onDeletePart={(part) => confirmDelete.ask('part', part)}
                    onAddPart={() => setPartModal({ mode: 'create' })}
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Selecciona una marca para ver sus modelos.</p>
            )}
          </div>
        </div>
      )}

      <NameFormModal
        open={brandModal?.mode === 'create'}
        title="Nueva marca"
        label="Nombre de la marca"
        placeholder="Ej: Samsung, Xiaomi..."
        submitLabel="Crear marca"
        onSubmit={createBrand}
        onClose={() => setBrandModal(null)}
      />
      <NameFormModal
        open={brandModal?.mode === 'edit'}
        title="Editar marca"
        label="Nombre de la marca"
        initialName={brandModal?.brand?.name ?? ''}
        submitLabel="Guardar cambios"
        onSubmit={(name) => updateBrand(brandModal.brand.id, name)}
        onClose={() => setBrandModal(null)}
      />

      <NameFormModal
        open={modelModal?.mode === 'create'}
        title="Nuevo modelo"
        label="Nombre del modelo"
        placeholder="Ej: Galaxy A52"
        submitLabel="Crear modelo"
        onSubmit={createModel}
        onClose={() => setModelModal(null)}
      />
      <NameFormModal
        open={modelModal?.mode === 'edit'}
        title="Editar modelo"
        label="Nombre del modelo"
        initialName={modelModal?.model?.name ?? ''}
        submitLabel="Guardar cambios"
        onSubmit={(name) => updateModel(modelModal.model.id, name)}
        onClose={() => setModelModal(null)}
      />

      <PartFormModal
        open={Boolean(partModal)}
        part={null}
        onSubmit={createPart}
        onClose={() => setPartModal(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete.pending)}
        title="Confirmar eliminación"
        message={
          confirmDelete.pending ? deleteMessages[confirmDelete.pending.kind](confirmDelete.pending.item) : ''
        }
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={confirmDelete.cancel}
      />
    </div>
  );
}
