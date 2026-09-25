import { useEffect, useState } from 'react';
import { Button, Input, Modal, NumberInput, Select } from '../../shared/ui/index.js';
import PhoneMultiSelect from './PhoneMultiSelect.jsx';

const DEFAULT_MIN_STOCK = 2;

function emptyForm() {
  return {
    categoryId: '',
    brandId: '',
    name: '',
    model: '',
    stock: '0',
    cost: '',
    salePrice: '',
    minStock: String(DEFAULT_MIN_STOCK),
    compatiblePhoneIds: [],
  };
}

function formFromProduct(product) {
  return {
    categoryId: product.category?.id ?? '',
    brandId: product.brand?.id ?? '',
    name: product.name ?? '',
    model: product.model ?? '',
    stock: String(product.stock ?? 0),
    cost: String(product.cost ?? 0),
    salePrice: String(product.salePrice ?? 0),
    minStock: String(product.minStock ?? DEFAULT_MIN_STOCK),
    compatiblePhoneIds: (product.compatiblePhones ?? []).map((phone) => phone.id),
  };
}

/** Mirrors CreateProductDto/UpdateProductDto (backend `class-validator` rules). */
function validate(values, mode) {
  const errors = {};

  if (!values.categoryId) errors.categoryId = 'La categoría es obligatoria';

  if (!values.name.trim()) errors.name = 'El nombre es obligatorio';
  else if (values.name.length > 200) errors.name = 'Máximo 200 caracteres';

  if (values.model && values.model.length > 200) errors.model = 'Máximo 200 caracteres';

  if (mode === 'create') {
    const stock = Number(values.stock);
    if (values.stock === '' || Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      errors.stock = 'Ingresa un stock inicial válido (0 o más)';
    }
  }

  const cost = Number(values.cost);
  if (values.cost === '' || Number.isNaN(cost) || cost < 0) {
    errors.cost = 'Ingresa un costo válido';
  }

  const salePrice = Number(values.salePrice);
  if (values.salePrice === '' || Number.isNaN(salePrice) || salePrice < 0) {
    errors.salePrice = 'Ingresa un precio de venta válido';
  }

  const minStock = Number(values.minStock);
  if (values.minStock === '' || Number.isNaN(minStock) || minStock < 0 || !Number.isInteger(minStock)) {
    errors.minStock = 'Ingresa un stock mínimo válido (0 o más)';
  }

  return errors;
}

/**
 * Create/edit modal for a product. Stock only changes through the +/-
 * adjust buttons once the product exists (PATCH never touches stock, per
 * the backend contract), so edit mode shows it read-only.
 */
export default function ProductFormModal({
  open,
  mode,
  product,
  categories,
  brands,
  phones,
  onCreateBrand,
  onCreatePhone,
  onSubmit,
  onClose,
}) {
  const [values, setValues] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [extraBrands, setExtraBrands] = useState([]);

  useEffect(() => {
    if (open) {
      setValues(mode === 'edit' && product ? formFromProduct(product) : emptyForm());
      setErrors({});
      setShowNewBrand(false);
      setNewBrandName('');
      setExtraBrands([]);
    }
  }, [open, mode, product]);

  if (!open) return null;

  const allBrands = [...brands, ...extraBrands.filter((b) => !brands.some((existing) => existing.id === b.id))];
  const editingWithBrand = mode === 'edit' && Boolean(product?.brand);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateBrand() {
    if (!newBrandName.trim()) return;
    setCreatingBrand(true);
    try {
      const created = await onCreateBrand(newBrandName.trim());
      setExtraBrands((current) => [...current, created]);
      setField('brandId', created.id);
      setNewBrandName('');
      setShowNewBrand(false);
    } finally {
      setCreatingBrand(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(values, mode);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      categoryId: values.categoryId,
      brandId: values.brandId || undefined,
      name: values.name.trim(),
      model: values.model.trim() || undefined,
      cost: Number(values.cost),
      salePrice: Number(values.salePrice),
      minStock: Number(values.minStock),
      compatiblePhoneIds: values.compatiblePhoneIds,
    };
    if (mode === 'create') {
      payload.stock = Number(values.stock);
    }

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch {
      // The mutation already toasted the error — keep the modal open so the user can fix it.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            name="categoryId"
            label="Categoría"
            value={values.categoryId}
            onChange={(e) => setField('categoryId', e.target.value)}
            error={errors.categoryId}
            options={[{ value: '', label: 'Selecciona...' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />

          <div className="flex flex-col gap-1">
            <Select
              name="brandId"
              label="Marca (opcional)"
              value={values.brandId}
              onChange={(e) => setField('brandId', e.target.value)}
              options={[{ value: '', label: 'Sin marca' }, ...allBrands.map((b) => ({ value: b.id, label: b.name }))]}
            />
            {editingWithBrand && (
              <span className="text-xs text-slate-500">La marca no se puede quitar, solo cambiar por otra.</span>
            )}
            {showNewBrand ? (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  name="new-brand-name"
                  placeholder="Nombre de la marca"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                />
                <Button type="button" onClick={handleCreateBrand} disabled={creatingBrand || !newBrandName.trim()}>
                  Crear
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowNewBrand(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewBrand(true)}
                className="w-fit text-xs font-medium text-brand-orange hover:underline"
              >
                + Nueva marca
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="name"
            label="Nombre"
            placeholder="Ej: Mica de vidrio 9H"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            error={errors.name}
          />
          <Input
            name="model"
            label="Modelo (opcional)"
            placeholder="Ej: Tipo C 1m"
            value={values.model}
            onChange={(e) => setField('model', e.target.value)}
            error={errors.model}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {mode === 'create' ? (
            <NumberInput
              name="stock"
              label="Stock inicial"
              min="0"
              value={values.stock}
              onChange={(e) => setField('stock', e.target.value)}
              error={errors.stock}
            />
          ) : (
            <div className="flex flex-col gap-1 text-sm text-brand-ink">
              <span className="font-medium">Stock</span>
              <span className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                {product?.stock ?? 0}
              </span>
              <span className="text-xs text-slate-500">El stock se cambia con +/−</span>
            </div>
          )}
          <NumberInput
            name="cost"
            label="Costo"
            min="0"
            step="0.01"
            value={values.cost}
            onChange={(e) => setField('cost', e.target.value)}
            error={errors.cost}
          />
          <NumberInput
            name="salePrice"
            label="Precio de venta"
            min="0"
            step="0.01"
            value={values.salePrice}
            onChange={(e) => setField('salePrice', e.target.value)}
            error={errors.salePrice}
          />
          <NumberInput
            name="minStock"
            label="Stock mínimo"
            min="0"
            value={values.minStock}
            onChange={(e) => setField('minStock', e.target.value)}
            error={errors.minStock}
          />
        </div>

        <PhoneMultiSelect
          phones={phones}
          selectedIds={values.compatiblePhoneIds}
          onChange={(ids) => setField('compatiblePhoneIds', ids)}
          brands={allBrands}
          onCreatePhone={onCreatePhone}
        />
      </form>
    </Modal>
  );
}
