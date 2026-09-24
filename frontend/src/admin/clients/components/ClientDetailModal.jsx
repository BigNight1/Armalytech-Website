import { useEffect, useState } from 'react';
import { Button, Input, Modal, Spinner } from '../../shared/ui/index.js';
import ConsentBadge from './ConsentBadge.jsx';
import { EVENT_TYPE_LABELS, REJECT_REASON_LABELS, formatLimaShort, formatPhone } from '../lib/format.js';

/** Client detail + edit form + that client's event history. */
export default function ClientDetailModal({ client, events, isLoadingEvents, onSave, onClose }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', marketingConsent: false });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setForm({
        firstName: client.firstName,
        lastName: client.lastName,
        marketingConsent: client.marketingConsent,
      });
    }
  }, [client]);

  if (!client) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave(client.id, form);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open={Boolean(client)} title="Detalle del cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Nombre"
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
          />
          <Input
            label="Apellido"
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
          />
        </div>

        <p className="text-sm text-slate-400">
          WhatsApp: <span className="text-brand-ink">{formatPhone(client.phoneE164)}</span>
        </p>

        <label className="flex items-center gap-2 text-sm text-brand-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-600 text-brand-orange focus:ring-brand-orange"
            checked={form.marketingConsent}
            onChange={(e) => setForm((prev) => ({ ...prev, marketingConsent: e.target.checked }))}
          />
          <span>Acepta promociones</span>
          <ConsentBadge approved={form.marketingConsent} />
        </label>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-700 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-brand-ink">Historial de este cliente</h3>
        {isLoadingEvents ? (
          <Spinner />
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-400">Sin eventos registrados todavía.</p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs"
              >
                <span className="font-medium text-brand-ink">
                  {EVENT_TYPE_LABELS[event.type] ?? event.type}
                  {event.rejectReason && ` — ${REJECT_REASON_LABELS[event.rejectReason] ?? event.rejectReason}`}
                </span>
                <span className="text-slate-400">{formatLimaShort(event.occurredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
