import { useState } from 'react';
import { Button, ConfirmDialog, Input, SkeletonRows } from '../../shared/ui/index.js';

/**
 * Generic list/create/rename/delete panel for a name-only catalog entity
 * (brands, categories). Delete goes through a ConfirmDialog; the owning
 * hook shows the "in use" 409 toast.
 */
export default function CatalogPanel({ title, items, isLoading, itemLabel, onCreate, onRename, onDelete }) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await onCreate(newName.trim());
      setNewName('');
    } catch {
      // The mutation already showed the error in a toast.
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditingName(item.name);
  }

  async function handleRename(event) {
    event.preventDefault();
    if (!editingName.trim()) return;
    setSaving(true);
    try {
      await onRename(editingId, editingName.trim());
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
      <h2 className="text-sm font-semibold text-brand-ink">{title}</h2>

      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <Input
          name={`new-${itemLabel}`}
          placeholder={`Nueva ${itemLabel}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={saving || !newName.trim()}>
          +
        </Button>
      </form>

      {isLoading ? (
        <SkeletonRows rows={4} columns={1} />
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-500">Sin registros.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-800">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2">
              {editingId === item.id ? (
                <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
                  <Input
                    name={`edit-${item.id}`}
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
                  <span className="text-sm text-brand-ink">{item.name}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(item)} className="text-xs font-medium text-brand-orange hover:underline">
                      Editar
                    </button>
                    <button type="button" onClick={() => setPendingDelete(item)} className="text-xs font-medium text-red-400 hover:underline">
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
        message={pendingDelete ? `Se eliminará "${pendingDelete.name}".` : ''}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
