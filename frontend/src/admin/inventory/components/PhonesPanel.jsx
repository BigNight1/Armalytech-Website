import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, Input, Select, SkeletonRows } from '../../shared/ui/index.js';

/**
 * Catálogo "Celulares" panel: filter by brand, create/rename/delete.
 * The design's "Celulares" panel creates a new phone from a single
 * "Nuevo modelo" text field — this app's data model requires a brand per
 * phone, so the brand + model inputs from the previous version are kept
 * (documented deviation) instead of the design's one-field mock.
 */
export default function PhonesPanel({ brands, phones, isLoading, brandFilter, onBrandFilterChange, onCreate, onRename, onDelete, className = '' }) {
  const [newBrandId, setNewBrandId] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    if (!newBrandId || !newName.trim()) return;
    setSaving(true);
    try {
      await onCreate(newBrandId, newName.trim());
      setNewName('');
    } catch {
      // The mutation already showed the error in a toast.
    } finally {
      setSaving(false);
    }
  }

  function startEdit(phone) {
    setEditingId(phone.id);
    setEditingName(phone.name);
  }

  async function handleRename(event) {
    event.preventDefault();
    if (!editingName.trim()) return;
    setSaving(true);
    try {
      await onRename(editingId, { name: editingName.trim() });
      setEditingId(null);
    } catch {
      // The mutation already showed the error in a toast.
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await onDelete(pendingDelete.id);
    } catch {
      // The mutation already showed the error in a toast.
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <section className={`flex flex-col gap-3.5 py-5 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">Celulares</h2>
        <span className="tabular-nums text-[15px] text-muted">{phones.length} modelos</span>
      </div>

      <Select
        name="phones-brand-filter"
        label="Filtrar por marca"
        value={brandFilter}
        onChange={(e) => onBrandFilterChange(e.target.value)}
        options={[{ value: '', label: 'Todas las marcas' }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
      />

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2">
        <div className="w-32">
          <Select
            name="new-phone-brand"
            label="Marca"
            value={newBrandId}
            onChange={(e) => setNewBrandId(e.target.value)}
            options={[{ value: '', label: 'Selecciona...' }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
          />
        </div>
        <div className="min-w-[120px] flex-1">
          <Input name="new-phone-name" label="Modelo" placeholder="Ej: A54" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving || !newBrandId || !newName.trim()}>
          Agregar
        </Button>
      </form>

      {isLoading ? (
        <SkeletonRows rows={4} columns={1} />
      ) : phones.length === 0 ? (
        <p className="text-sm text-muted">Sin registros.</p>
      ) : (
        <ul className="flex flex-col border-t-2 border-line">
          {phones.map((phone) => (
            <li key={phone.id} className="flex min-h-[52px] items-center gap-2.5 border-b border-line py-2">
              {editingId === phone.id ? (
                <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
                  <Input
                    name={`edit-phone-${phone.id}`}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" disabled={saving}>
                    Guardar
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <>
                  <span className="min-w-[70px] text-sm text-muted">{phone.brandName}</span>
                  <span className="flex-1 font-semibold text-ink">{phone.name}</span>
                  <button
                    type="button"
                    title="Renombrar"
                    aria-label={`Renombrar ${phone.brandName} ${phone.name}`}
                    onClick={() => startEdit(phone)}
                    className="flex h-8 w-8 items-center justify-center text-muted hover:text-accent-ink"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    aria-label={`Eliminar ${phone.brandName} ${phone.name}`}
                    onClick={() => setPendingDelete(phone)}
                    className="flex h-8 w-8 items-center justify-center text-muted hover:text-danger-ink"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Confirmar eliminación"
        message={pendingDelete ? `Se eliminará "${pendingDelete.brandName} ${pendingDelete.name}" del catálogo. Esta acción no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
