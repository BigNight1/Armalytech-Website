import { useEffect, useRef, useState } from 'react';
import { Button, Input, Modal, NumberInput, Select } from '../../shared/ui/index.js';
import { formatPEN } from '../../shared/lib/money.js';
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
 *
 * Rendered as a right-side drawer via the shared `Modal` (design: `pf`
 * panel, 620px, closePf) — `variant="drawer" size="md"`. ConfirmDialog and
 * the product-form validation error still follow the shared danger tokens.
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
  const initialValuesRef = useRef(emptyForm());

  useEffect(() => {
    if (open) {
      const baseline = mode === 'edit' && product ? formFromProduct(product) : emptyForm();
      setValues(baseline);
      initialValuesRef.current = baseline;
      setErrors({});
      setShowNewBrand(false);
      setNewBrandName('');
      setExtraBrands([]);
    }
  }, [open, mode, product]);

  // Unsaved-changes guard (odd/tasks/unsaved-changes-guard.md): dirty when
  // any field diverges from the snapshot taken when the drawer opened, or
  // when the inline "nueva marca" mini-form has unsaved text.
  const isDirty =
    newBrandName.trim() !== '' ||
    JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);

  const allBrands = [...brands, ...extraBrands.filter((b) => !brands.some((existing) => existing.id === b.id))];
  const editingWithBrand = mode === 'edit' && Boolean(product?.brand);

  const cost = Number(values.cost) || 0;
  const salePrice = Number(values.salePrice) || 0;
  const profit = salePrice - cost;
  const margin = salePrice > 0 ? Math.round((profit / salePrice) * 100) : 0;

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
      variant="drawer"
      size="md"
      title={mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
      header={
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">
            {mode === 'edit' ? 'Inventario · editar' : 'Inventario · nuevo'}
          </span>
          <h2 className="text-2xl">{mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}</h2>
        </div>
      }
      onClose={onClose}
      dismissible={false}
      isDirty={isDirty}
      footer={(requestClose) => (
        <>
          <Button variant="secondary" onClick={requestClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="contents">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            name="categoryId"
            label="Categoría"
            size="lg"
            value={values.categoryId}
            onChange={(e) => setField('categoryId', e.target.value)}
            error={errors.categoryId}
            options={[{ value: '', label: 'Selecciona...' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />

          <div className="flex flex-col gap-1">
            <Select
              name="brandId"
              label="Marca (opcional)"
              size="lg"
              value={values.brandId}
              onChange={(e) => setField('brandId', e.target.value)}
              options={[{ value: '', label: 'Sin marca' }, ...allBrands.map((b) => ({ value: b.id, label: b.name }))]}
            />
            {editingWithBrand && (
              <span className="text-xs text-muted">La marca no se puede quitar, solo cambiar por otra.</span>
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
              <button type="button" onClick={() => setShowNewBrand(true)} className="w-fit text-xs font-bold text-accent-ink hover:underline">
                + Nueva marca
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="name"
            label="Nombre"
            size="lg"
            placeholder="Ej: Mica de vidrio 9H"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            error={errors.name}
          />
          <Input
            name="model"
            label="Modelo (opcional)"
            size="lg"
            placeholder="Ej: Tipo C 1m"
            value={values.model}
            onChange={(e) => setField('model', e.target.value)}
            error={errors.model}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {mode === 'create' ? (
            <NumberInput
              name="stock"
              label="Stock inicial"
              size="lg"
              min="0"
              value={values.stock}
              onChange={(e) => setField('stock', e.target.value)}
              error={errors.stock}
            />
          ) : (
            <div className="flex flex-col gap-1.5 text-sm text-ink">
              <span className="text-xs font-medium text-muted">Stock</span>
              <span className="flex min-h-[46px] items-center border border-dashed border-line bg-surface px-3 text-base font-extrabold">
                {product?.stock ?? 0}
              </span>
            </div>
          )}
          <NumberInput
            name="cost"
            label="Costo (S/)"
            size="lg"
            min="0"
            step="0.01"
            value={values.cost}
            onChange={(e) => setField('cost', e.target.value)}
            error={errors.cost}
          />
          <NumberInput
            name="salePrice"
            label="Precio venta (S/)"
            size="lg"
            min="0"
            step="0.01"
            value={values.salePrice}
            onChange={(e) => setField('salePrice', e.target.value)}
            error={errors.salePrice}
          />
          <NumberInput
            name="minStock"
            label="Stock mínimo"
            size="lg"
            min="0"
            value={values.minStock}
            onChange={(e) => setField('minStock', e.target.value)}
            error={errors.minStock}
          />
        </div>
        {mode === 'edit' && <span className="-mt-2 text-sm text-muted">El stock se cambia con los botones + / − de la tabla.</span>}

        <div className="flex flex-col border-t-2 border-ink border-b-2 border-b-line sm:flex-row">
          <div className="flex flex-1 flex-col gap-0.5 py-3.5">
            <span className="text-sm text-muted">Ganancia por unidad</span>
            <span className={`text-[28px] font-extrabold tabular-nums ${profit < 0 ? 'text-danger-ink' : 'text-accent-ink'}`}>
              {formatPEN(profit)}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5 border-t border-line py-3.5 sm:border-l-2 sm:border-t-0 sm:pl-5">
            <span className="text-sm text-muted">Margen sobre venta</span>
            <span className="text-[28px] font-extrabold">{margin} %</span>
          </div>
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
