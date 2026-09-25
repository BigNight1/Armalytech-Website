import { useMemo, useState } from 'react';
import { Button, Input, Select } from '../../shared/ui/index.js';

/**
 * Searchable multi-select for a product's compatible phones, with inline
 * "Agregar celular" (pick brand + name) that creates a new phone and
 * selects it immediately.
 */
export default function PhoneMultiSelect({ phones, selectedIds, onChange, brands, onCreatePhone }) {
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newBrandId, setNewBrandId] = useState('');
  const [newPhoneName, setNewPhoneName] = useState('');
  const [creating, setCreating] = useState(false);
  // Phones just created here, in case the parent's `phones` list hasn't
  // refetched yet — keeps the chip/selection visible without a flash.
  const [extraPhones, setExtraPhones] = useState([]);

  const allPhones = useMemo(() => {
    const known = new Set(phones.map((phone) => phone.id));
    return [...phones, ...extraPhones.filter((phone) => !known.has(phone.id))];
  }, [phones, extraPhones]);

  const selectedPhones = useMemo(
    () => selectedIds.map((id) => allPhones.find((phone) => phone.id === id)).filter(Boolean),
    [selectedIds, allPhones],
  );

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return allPhones
      .filter((phone) => !selectedIds.includes(phone.id))
      .filter((phone) => `${phone.brandName} ${phone.name}`.toLowerCase().includes(trimmed))
      .slice(0, 8);
  }, [allPhones, query, selectedIds]);

  function addPhone(id) {
    onChange([...selectedIds, id]);
    setQuery('');
  }

  function removePhone(id) {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  }

  async function handleCreatePhone() {
    if (!newBrandId || !newPhoneName.trim()) return;
    setCreating(true);
    try {
      const created = await onCreatePhone(newBrandId, newPhoneName.trim());
      const brand = brands.find((b) => b.id === newBrandId);
      const withBrand = { ...created, brandName: brand?.name ?? '' };
      setExtraPhones((current) => [...current, withBrand]);
      onChange([...selectedIds, withBrand.id]);
      setNewPhoneName('');
      setShowAdd(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-brand-ink">Compatible con</span>

      {selectedPhones.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPhones.map((phone) => (
            <span
              key={phone.id}
              className="inline-flex items-center gap-1 rounded-full border border-brand-orange/40 bg-brand-orange/10 px-2.5 py-1 text-xs text-brand-orange"
            >
              {phone.brandName} {phone.name}
              <button
                type="button"
                onClick={() => removePhone(phone.id)}
                className="text-brand-orange/70 hover:text-brand-orange"
                aria-label={`Quitar ${phone.brandName} ${phone.name}`}
              >
                &#10005;
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          name="phone-search"
          placeholder="Buscar celular por marca o modelo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-lg">
            {matches.map((phone) => (
              <li key={phone.id}>
                <button
                  type="button"
                  onClick={() => addPhone(phone.id)}
                  className="block w-full px-3 py-2 text-left text-sm text-brand-ink hover:bg-slate-800"
                >
                  {phone.brandName} {phone.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAdd ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-700 p-3">
          <div className="w-36">
            <Select
              name="new-phone-brand"
              label="Marca"
              value={newBrandId}
              onChange={(e) => setNewBrandId(e.target.value)}
              options={[{ value: '', label: 'Selecciona...' }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <Input
              name="new-phone-name"
              label="Modelo"
              placeholder="Ej: A54"
              value={newPhoneName}
              onChange={(e) => setNewPhoneName(e.target.value)}
            />
          </div>
          <Button type="button" onClick={handleCreatePhone} disabled={creating || !newBrandId || !newPhoneName.trim()}>
            Agregar
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="w-fit text-xs font-medium text-brand-orange hover:underline"
        >
          + Agregar celular
        </button>
      )}
    </div>
  );
}
