import { useEffect, useState } from 'react';
import { Button, Input, Modal, Spinner } from '../../shared/ui/index.js';
import ConsentBadge from './ConsentBadge.jsx';
import LoyaltyStamps from './LoyaltyStamps.jsx';
import {
  EVENT_TYPE_LABELS,
  REJECT_REASON_LABELS,
  formatLimaShort,
  formatPhone,
} from '../lib/format.js';
import { clientsApi } from '../api/clientsApi.js';

export default function ClientDetailModal({
  client,
  events,
  isLoadingEvents,
  onSave,
  onClientUpdated,
  onClose,
}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', marketingConsent: false });
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (client) {
      setForm({
        firstName: client.firstName,
        lastName: client.lastName,
        marketingConsent: client.marketingConsent,
      });
      setActionMessage(null);
    }
  }, [client]);

  if (!client) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updated = await onSave(client.id, form);
      if (onClientUpdated && updated) onClientUpdated(updated);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddVisit() {
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await clientsApi.registerClientVisit(client.id);
      const updated = res.client;
      if (onClientUpdated) onClientUpdated(updated);

      if (res.thresholdReached) {
        setActionMessage({
          type: 'threshold',
          text: '¡Sello 4 alcanzado! Se ha enviado recordatorio por WhatsApp / n8n para la promo del 20%.',
        });
      } else if (res.rewardReady) {
        setActionMessage({
          type: 'reward',
          text: '¡5 Sellos acumulados! El 20% de descuento está listo para ser canjeado.',
        });
      } else {
        setActionMessage({
          type: 'success',
          text: `Visita registrada. Sellos actuales: ${updated.stamps}/5.`,
        });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al sumar visita' });
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleClaimReward() {
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const updated = await clientsApi.claimReward(client.id);
      if (onClientUpdated) onClientUpdated(updated);
      setActionMessage({
        type: 'reward',
        text: '¡Premio de 20% canjeado exitosamente! El ciclo de sellos se reinició a 0 para el siguiente premio.',
      });
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al canjear premio' });
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleSendMessage(template) {
    if (!client.marketingConsent) {
      setActionMessage({
        type: 'error',
        text: 'El cliente no ha aprobado el envío de promociones/mensajes.',
      });
      return;
    }

    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await clientsApi.sendMessage(client.id, template);
      const messageText = res.message || '';

      // Open WhatsApp Web with pre-filled message
      const cleanPhone = client.phoneE164.replace(/\D/g, '');
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setActionMessage({
        type: 'success',
        text: `Acción ejecutada: WhatsApp preparado y evento registrado (${template}).`,
      });
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al emitir mensaje' });
    } finally {
      setIsActionLoading(false);
    }
  }

  const isRewardReady = (client.stamps ?? 0) >= 5;

  return (
    <Modal open={Boolean(client)} title="Detalle del Cliente" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Loyalty Program Section */}
        <div className="flex flex-col gap-3">
          <LoyaltyStamps stamps={client.stamps ?? 0} size="md" />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVisit}
                disabled={isActionLoading}
              >
                {isActionLoading ? <Spinner size="sm" /> : '+ Registrar 1 Visita'}
              </Button>

              {isRewardReady && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleClaimReward}
                  disabled={isActionLoading}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold border-none shadow-md shadow-orange-500/30"
                >
                  ★ Canjear 20% de Descuento
                </Button>
              )}
            </div>

            <div className="text-right text-xs text-slate-400">
              Ciclo actual: <strong className="text-brand-ink">#{client.loyaltyCycle ?? 1}</strong> | Canjeados:{' '}
              <strong className="text-brand-ink">{client.rewardsClaimed ?? 0}</strong>
            </div>
          </div>

          {actionMessage && (
            <div
              className={`p-2.5 rounded-lg border text-xs ${
                actionMessage.type === 'error'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : actionMessage.type === 'reward'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {actionMessage.text}
            </div>
          )}
        </div>

        {/* Direct Messaging / n8n Action Buttons */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Acciones de Mensajería & Fidelización
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isActionLoading || !client.marketingConsent}
              onClick={() => handleSendMessage('promo_20')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2.5 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/20 disabled:opacity-40 transition-colors"
              title="Enviar o preparar recordatorio del 20% de descuento"
            >
              <span>🎯 Enviar Promo 20%</span>
            </button>

            <button
              type="button"
              disabled={isActionLoading || !client.marketingConsent}
              onClick={() => handleSendMessage('google_review')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 transition-colors"
              title="Solicitar reseña 5 estrellas en Google Maps"
            >
              <span>⭐ Pedir Reseña Maps</span>
            </button>

            <button
              type="button"
              disabled={isActionLoading || !client.marketingConsent}
              onClick={() => handleSendMessage('reconnect')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 transition-colors"
              title="Invitar a volver para mantenimiento de equipo"
            >
              <span>🔄 Invitar a Volver</span>
            </button>
          </div>
          {!client.marketingConsent && (
            <p className="text-[11px] text-amber-400/80">
              * El cliente descartó promociones. Activa la casilla abajo si el cliente solicita recibir mensajes.
            </p>
          )}
        </div>

        {/* Client Edit Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-700/80 pt-4">
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
            WhatsApp:{' '}
            <span className="text-brand-ink font-mono font-medium">
              {formatPhone(client.phoneE164)}
            </span>
          </p>

          <label className="flex items-center gap-2 text-sm text-brand-ink cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 text-brand-orange focus:ring-brand-orange"
              checked={form.marketingConsent}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, marketingConsent: e.target.checked }))
              }
            />
            <span>Acepta promociones</span>
            <ConsentBadge approved={form.marketingConsent} />
          </label>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>

        {/* Event History */}
        <div className="border-t border-slate-700 pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Historial de Visitas y Eventos
          </h3>
          {isLoadingEvents ? (
            <Spinner />
          ) : events.length === 0 ? (
            <p className="text-sm text-slate-400">Sin eventos registrados todavía.</p>
          ) : (
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-brand-ink">
                    {EVENT_TYPE_LABELS[event.type] ?? event.type}
                    {event.rejectReason &&
                      ` — ${REJECT_REASON_LABELS[event.rejectReason] ?? event.rejectReason}`}
                  </span>
                  <span className="text-slate-400">{formatLimaShort(event.occurredAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
