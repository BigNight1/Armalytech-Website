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

const CHANNEL_LABELS = { qr: 'QR', nfc: 'NFC', manual: 'Manual' };

const MESSAGE_CLASSES = {
  success: 'border-t-2 border-ink bg-surface text-ink',
  threshold: 'border-t-2 border-accent bg-accent-100 text-accent-ink',
  reward: 'border-t-2 border-accent bg-accent-100 font-bold text-accent-900',
  error: 'border-t-2 border-danger bg-danger-bg text-danger-ink',
};

const MESSAGE_BUTTONS = [
  { key: 'promo_20', title: 'Enviar promo 20%', subtitle: 'Recordatorio de descuento' },
  { key: 'google_review', title: 'Pedir reseña', subtitle: '5 estrellas en Google Maps' },
  { key: 'reconnect', title: 'Invitar a volver', subtitle: 'Mantenimiento de equipo' },
];

/** `'Jhon', 'Medina' -> 'JM'` — the drawer header avatar (design: `cli.initials`). */
function getClientInitials(firstName, lastName) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  return initials || '--';
}

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
          text: '¡Sello 4 alcanzado! Se ha enviado recordatorio por WhatsApp para la promo del 20%.',
        });
      } else if (res.rewardReady) {
        setActionMessage({
          type: 'reward',
          text: '¡5 sellos acumulados! El 20% de descuento está listo para ser canjeado.',
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
        text: '¡Premio de 20% canjeado! El ciclo de sellos se reinició a 0 para el siguiente premio.',
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

      const cleanPhone = client.phoneE164.replace(/\D/g, '');
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setActionMessage({
        type: 'success',
        text: 'WhatsApp abierto con el mensaje preparado y evento registrado.',
      });
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al emitir mensaje' });
    } finally {
      setIsActionLoading(false);
    }
  }

  const stamps = client.stamps ?? 0;
  const canClaim = stamps >= 5;
  const badge = stamps >= 5 ? '¡20% OFF desbloqueado!' : stamps === 4 ? '¡A 1 visita del premio!' : null;
  const loyaltyText =
    stamps >= 5
      ? 'Completó 5 visitas. Puede canjear su 20% de descuento en esta reparación.'
      : stamps === 4
      ? 'Se envió recordatorio por WhatsApp. En su próxima visita gana 20% de descuento.'
      : 'Acumula 5 visitas de reparación o servicio para ganar 20% de descuento.';

  const initials = getClientInitials(client.firstName, client.lastName);

  return (
    <Modal
      open={Boolean(client)}
      variant="drawer"
      size="lg"
      title={`${client.firstName} ${client.lastName}`}
      header={
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 flex-none items-center justify-center bg-ink text-xl font-extrabold text-bg">
            {initials}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">Detalle del cliente</span>
            <h2 className="text-2xl">
              {client.firstName} {client.lastName}
            </h2>
            <span className="text-[15px] tabular-nums text-muted">
              {formatPhone(client.phoneE164)} · {CHANNEL_LABELS[client.channel] ?? client.channel}
            </span>
          </div>
        </div>
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        {/* Loyalty program */}
        <section className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
              Programa de fidelización
            </span>
            {badge && <span className="bg-accent px-2 py-0.5 text-[13px] font-extrabold text-on-accent">{badge}</span>}
            <span className="ml-auto text-[15px] font-extrabold text-ink">{stamps} / 5 sellos</span>
          </div>

          <LoyaltyStamps stamps={stamps} size="lg" />

          <p className="text-[15px] leading-normal text-muted">{loyaltyText}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleAddVisit} disabled={isActionLoading}>
              {isActionLoading ? <Spinner size="sm" /> : <span>+ Registrar 1 visita</span>}
            </Button>

            {canClaim && (
              <Button onClick={handleClaimReward} disabled={isActionLoading}>
                ★ Canjear 20% de descuento
              </Button>
            )}

            <span className="ml-auto text-sm text-muted">
              Ciclo <strong className="text-ink">#{client.loyaltyCycle ?? 1}</strong> · Canjeados{' '}
              <strong className="text-ink">{client.rewardsClaimed ?? 0}</strong>
            </span>
          </div>

          {actionMessage && (
            <div className={`p-3 text-[15px] ${MESSAGE_CLASSES[actionMessage.type] ?? MESSAGE_CLASSES.success}`}>
              {actionMessage.text}
            </div>
          )}
        </section>

        {/* WhatsApp messaging */}
        <section className="flex flex-col gap-3 border-t-2 border-ink pt-4">
          <h3>Mensajería por WhatsApp</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {MESSAGE_BUTTONS.map((btn) => (
              <button
                key={btn.key}
                type="button"
                disabled={isActionLoading || !client.marketingConsent}
                onClick={() => handleSendMessage(btn.key)}
                className="flex flex-col items-start gap-1 border border-line p-3 text-left text-[15px] text-ink transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="font-extrabold">{btn.title}</span>
                <span className="text-[13px] text-muted">{btn.subtitle}</span>
              </button>
            ))}
          </div>
          {!client.marketingConsent && (
            <p className="text-sm text-accent-ink">
              El cliente descartó promociones. Activa &ldquo;Acepta promociones&rdquo; abajo y guarda si pide recibir
              mensajes.
            </p>
          )}
        </section>

        {/* Datos */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 border-t-2 border-ink pt-4">
          <h3>Datos</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              size="lg"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            />
            <Input
              label="Apellido"
              size="lg"
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-[15px] text-ink">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(e) => setForm((prev) => ({ ...prev, marketingConsent: e.target.checked }))}
                className="h-[18px] w-[18px] accent-accent"
              />
              <span>Acepta promociones</span>
              <ConsentBadge approved={form.marketingConsent} />
            </label>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>

        {/* History */}
        <section className="border-t-2 border-ink pt-4">
          <h3 className="mb-2">Historial de visitas y eventos</h3>
          {isLoadingEvents ? (
            <Spinner />
          ) : events.length === 0 ? (
            <p className="text-sm text-muted">Sin eventos registrados todavía.</p>
          ) : (
            <ul className="flex max-h-48 flex-col overflow-y-auto pr-1">
              {events.map((event, index) => (
                <li
                  key={event.id}
                  className="flex items-center gap-3 border-b border-line py-2.5 text-[15px]"
                >
                  <span className={`h-2.5 w-2.5 flex-none ${index === 0 ? 'bg-accent' : 'bg-line'}`} />
                  <span className="flex-1 font-semibold text-ink">
                    {EVENT_TYPE_LABELS[event.type] ?? event.type}
                    {event.rejectReason && ` — ${REJECT_REASON_LABELS[event.rejectReason] ?? event.rejectReason}`}
                  </span>
                  <span className="whitespace-nowrap text-sm text-muted">{formatLimaShort(event.occurredAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}
