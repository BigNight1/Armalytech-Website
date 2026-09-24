import { useEffect, useState } from 'react';
import { Modal, Button, Input, NumberInput } from '../../shared/ui/index.js';

const EMPTY_FORM = { name: '', quantity: '0', purchasePrice: '0', salePrice: '0' };

function partToForm(part) {
  if (!part) return EMPTY_FORM;
  return {
    name: part.name,
    quantity: String(part.quantity),
    purchasePrice: String(part.purchasePrice),
    salePrice: String(part.salePrice),
  };
}

/** Create/edit modal for a part (name, quantity, purchase/sale price). */
export default function PartFormModal({ open, part, onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isEditing = Boolean(part);

  useEffect(() => {
    if (open) {
      setForm(partToForm(part));
      setError(null);
    }
  }, [open, part]);

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: trimmedName,
        quantity: Number.parseInt(form.quantity, 10) || 0,
        purchasePrice: Number.parseFloat(form.purchasePrice) || 0,
        salePrice: Number.parseFloat(form.salePrice) || 0,
      });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? 'Editar repuesto' : 'Nuevo repuesto'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="part-form-modal" disabled={isSubmitting || !form.name.trim()}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="part-form-modal" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Nombre del repuesto"
          name="name"
          value={form.name}
          onChange={setField('name')}
          placeholder="Ej: Pantalla, Batería..."
          error={error}
          autoFocus
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberInput label="Cantidad" name="quantity" value={form.quantity} onChange={setField('quantity')} min={0} step="1" />
          <NumberInput
            label="Precio compra (S/)"
            name="purchasePrice"
            value={form.purchasePrice}
            onChange={setField('purchasePrice')}
            min={0}
          />
          <NumberInput
            label="Precio venta (S/)"
            name="salePrice"
            value={form.salePrice}
            onChange={setField('salePrice')}
            min={0}
          />
        </div>
      </form>
    </Modal>
  );
}
