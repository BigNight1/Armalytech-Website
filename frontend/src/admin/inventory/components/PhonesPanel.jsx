import { useState } from 'react';
import { Button, ConfirmDialog, Input, Select, SkeletonRows } from '../../shared/ui/index.js';

/** Catálogo "Celulares" panel: filter by brand, create/rename/delete. */
export default function PhonesPanel({ brands, phones, isLoading, brandFilter, onBrandFilterChange, onCreate, onRename, onDelete }) {
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
    <div className="flex flex-col gap-3 rounded-xl border border-slate-700 p-4">
      <h2 className="text-sm font-semibold text-brand-ink">Celulares</h2>

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
          +
        </Button>
      </form>

      {isLoading ? (
        <SkeletonRows rows={4} columns={1} />
      ) : phones.length === 0 ? (
        <p className="text-xs text-slate-500">Sin registros.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-800">
          {phones.map((phone) => (
            <li key={phone.id} className="flex items-center justify-between gap-2 py-2">
              {editingId === phone.id ? (
                <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
                  <Input
                    name={`edit-phone-${phone.id}`}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" variant="ghost" disabled={saving}>
                    Guardar
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <>
                  <span className="text-sm text-brand-ink">
                    {phone.brandName} {phone.name}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(phone)} className="text-xs font-medium text-brand-orange hover:underline">
                      Editar
                    </button>
                    <button type="button" onClick={() => setPendingDelete(phone)} className="text-xs font-medium text-red-400 hover:underline">
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Confirmar eliminación"
        message={pendingDelete ? `Se eliminará "${pendingDelete.brandName} ${pendingDelete.name}".` : ''}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
