import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, Input, SkeletonRows } from '../../shared/ui/index.js';

/**
 * Generic list/create/rename/delete panel for a name-only catalog entity
 * (brands, categories). Delete goes through a ConfirmDialog; the owning
 * hook shows the "in use" 409 toast.
 */
export default function CatalogPanel({ title, countLabel, items, isLoading, itemLabel, onCreate, onRename, onDelete, className = '' }) {
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
    <section className={`flex flex-col gap-3.5 py-5 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">{title}</h2>
        <span className="tabular-nums text-[15px] text-muted">
          {items.length} {countLabel}
        </span>
      </div>

      <form onSubmit={handleCreate} className="flex">
        <div className="min-w-0 flex-1">
          <Input
            name={`new-${itemLabel}`}
            placeholder={`Nueva ${itemLabel}`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border-r-0"
          />
        </div>
        <Button type="submit" disabled={saving || !newName.trim()} className="shrink-0">
          Agregar
        </Button>
      </form>

      {isLoading ? (
        <SkeletonRows rows={4} columns={1} />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">Sin registros.</p>
      ) : (
        <ul className="flex flex-col border-t-2 border-line">
          {items.map((item) => (
            <li key={item.id} className="flex min-h-[52px] items-center gap-2.5 border-b border-line py-2">
              {editingId === item.id ? (
                <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
                  <Input
                    name={`edit-${item.id}`}
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
                  <span className="flex-1 font-semibold text-ink">{item.name}</span>
                  <button
                    type="button"
                    title="Renombrar"
                    aria-label={`Renombrar ${item.name}`}
                    onClick={() => startEdit(item)}
                    className="flex h-8 w-8 items-center justify-center text-muted hover:text-accent-ink"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    aria-label={`Eliminar ${item.name}`}
                    onClick={() => setPendingDelete(item)}
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
        message={pendingDelete ? `Se eliminará "${pendingDelete.name}" del catálogo. Esta acción no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
