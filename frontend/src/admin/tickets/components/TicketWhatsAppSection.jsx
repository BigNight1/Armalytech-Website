import { useState } from 'react';
import { ConfirmDialog, Tag, useToast } from '../../shared/ui/index.js';
import { formatLimaShort } from '../../shared/lib/time.js';
import { useSendTicketWhatsApp, useTicketWhatsApp } from '../hooks/useTicketWhatsApp.js';

// Which template each ticket status can send. Other statuses only show history.
const TEMPLATE_BY_ESTADO = {
  listo: { template: 'ticket_listo', label: 'Avisar que está listo', marketing: false },
  entregado: { template: 'resena_google', label: 'Pedir reseña', marketing: true },
};

const TEMPLATE_LABELS = {
  ticket_listo: 'Aviso: equipo listo',
  resena_google: 'Pedido de reseña',
};

const STATUS_CHIPS = {
  sent: { label: 'Enviado', variant: 'neutral' },
  delivered: { label: 'Entregado', variant: 'accent' },
  read: { label: 'Leído', variant: 'solid' },
  failed: { label: 'Falló', variant: 'danger' },
};

const MARKETING_BLOCKED_HINTS = {
  no_consent: 'Sin consentimiento de marketing',
  opted_out: 'El cliente se dio de baja',
  no_client: 'Ticket sin cliente registrado',
};

const ERROR_MESSAGES = {
  invalid_state: 'El ticket no está en el estado correcto para este mensaje',
  already_sent: 'Ese mensaje ya se envió',
  marketing_not_allowed: 'El cliente no aceptó mensajes de marketing',
  invalid_phone: 'El número del cliente no es válido',
  whatsapp_not_configured: 'WhatsApp no está configurado en el servidor',
};

const SEND_ERROR_FALLBACK = 'No se pudo enviar el mensaje';
const SEND_FAILED_CODE = 'whatsapp_send_failed';
const NOT_CONFIGURED_CODE = 'whatsapp_not_configured';

const KNOWN_ERROR_CODES = [...Object.keys(ERROR_MESSAGES), SEND_FAILED_CODE];

/**
 * The API reports the failure code as the response `message`; `ApiError.code`
 * may carry it too (domain errors) or a generic status code (HttpException).
 * Accept either so the Spanish copy does not depend on that detail.
 */
function resolveErrorCode(err) {
  return [err?.message, err?.code, err?.details?.message, err?.details?.code].find((candidate) =>
    KNOWN_ERROR_CODES.includes(candidate),
  );
}

function sendFailedDetail(err) {
  const details = err?.details ?? {};
  const detail = details.detail ?? details.reason ?? details.providerMessage ?? details.errorMessage;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  // A message that is not the bare code is the provider text itself.
  if (typeof err?.message === 'string' && err.message !== SEND_FAILED_CODE && resolveErrorCode(err)) {
    return err.message;
  }
  return '';
}

function describeSendError(err) {
  const code = resolveErrorCode(err);
  if (code === SEND_FAILED_CODE) {
    const detail = sendFailedDetail(err);
    return detail ? `WhatsApp rechazó el envío: ${detail}` : 'WhatsApp rechazó el envío';
  }
  return ERROR_MESSAGES[code] ?? SEND_ERROR_FALLBACK;
}

function byNewest(a, b) {
  return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
}

export default function TicketWhatsAppSection({ ticket }) {
  const { notify } = useToast();
  const { data, isLoading, isError, error, refetch } = useTicketWhatsApp(ticket.id);
  const sendMutation = useSendTicketWhatsApp(ticket.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const items = [...(data?.items ?? [])].sort(byNewest);
  const windowOpen = Boolean(data?.window?.open);
  const marketing = data?.marketing;
  const notConfigured =
    isError && error?.status === 503 && resolveErrorCode(error) === NOT_CONFIGURED_CODE;

  const action = TEMPLATE_BY_ESTADO[ticket.estado];
  const templateItems = action ? items.filter((item) => item.template === action.template) : [];
  const lastAttempt = templateItems[0];
  const lastDelivered = templateItems.find((item) => item.status !== 'failed');
  const lastAttemptFailed = lastAttempt?.status === 'failed';
  // A resend needs `force` whenever an earlier attempt was not rejected.
  const needsForce = Boolean(lastDelivered);
  const needsConfirm = needsForce && !lastAttemptFailed;

  const marketingBlocked = Boolean(action?.marketing) && marketing?.allowed === false;
  const blockedHint = marketingBlocked
    ? (MARKETING_BLOCKED_HINTS[marketing?.reason] ?? 'El cliente no aceptó mensajes de marketing')
    : '';

  const isSending = sendMutation.isPending;

  let buttonLabel = action?.label ?? '';
  if (lastAttemptFailed) buttonLabel = 'Reintentar';
  else if (needsConfirm) buttonLabel = 'Reenviar';

  async function send() {
    try {
      await sendMutation.mutateAsync({ template: action.template, force: needsForce });
      notify('Mensaje enviado por WhatsApp', { type: 'success' });
    } catch (err) {
      notify(describeSendError(err), { type: 'error' });
    } finally {
      setConfirmOpen(false);
    }
  }

  function handleClick() {
    if (needsConfirm) {
      setConfirmOpen(true);
      return;
    }
    send();
  }

  let body;
  if (isLoading) {
    body = <p className="m-0 text-sm text-muted italic">Cargando WhatsApp…</p>;
  } else if (notConfigured) {
    body = (
      <p className="m-0 text-sm text-muted italic">
        WhatsApp no está configurado en el servidor. Usa “Abrir chat” para escribir manualmente.
      </p>
    );
  } else if (isError) {
    body = (
      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 text-sm text-danger-ink font-semibold">
          No se pudo cargar el historial de WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn btn-secondary min-h-[36px] text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  } else {
    body = (
      <>
        {action && (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleClick}
              disabled={isSending || marketingBlocked}
              className={`btn ${
                needsConfirm ? 'btn-secondary' : 'btn-primary'
              } min-h-[46px] px-5 text-[15px] font-bold w-full sm:w-fit`}
            >
              {isSending ? 'Enviando…' : buttonLabel}
            </button>
            {blockedHint && <span className="text-sm text-muted">{blockedHint}</span>}
          </div>
        )}

        {items.length === 0 ? (
          <p className="m-0 text-sm text-muted italic">Sin mensajes enviados.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {items.map((item) => {
              const chip = STATUS_CHIPS[item.status] ?? STATUS_CHIPS.sent;
              const failure = item.status === 'failed' ? item.error?.message || item.error?.title : '';
              const sender =
                item.trigger === 'auto' ? 'Automático' : item.sentByEmail || '—';
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 border-b border-line py-2.5 text-[15px]"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-bold text-ink">
                      {TEMPLATE_LABELS[item.template] ?? item.template}
                    </span>
                    <Tag variant={chip.variant} className="ml-auto">
                      {chip.label}
                    </Tag>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                    <span className="tabular-nums">{formatLimaShort(item.sentAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="min-w-0 truncate" title={item.sentByEmail || undefined}>
                      {sender}
                    </span>
                  </div>
                  {failure && <span className="text-sm text-danger-ink">{failure}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  return (
    <section className="flex flex-col gap-2.5 border-t-2 border-ink pt-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="m-0 text-lg font-extrabold text-ink">WhatsApp</h3>
        {windowOpen && <Tag variant="accent">Ventana de 24 h abierta</Tag>}
      </div>

      {body}

      <ConfirmDialog
        open={confirmOpen}
        title="Reenviar mensaje"
        message={`Ya se envió el ${formatLimaShort(lastDelivered?.sentAt)}. Cada envío se cobra. ¿Reenviar?`}
        confirmLabel={isSending ? 'Enviando…' : 'Reenviar'}
        danger={false}
        loading={isSending}
        onConfirm={send}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
