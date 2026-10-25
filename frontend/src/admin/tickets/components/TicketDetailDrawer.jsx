import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  Printer,
  X,
  AlertTriangle,
} from 'lucide-react';
import TicketStatusBadge, { TICKET_ESTADO_CONFIG } from './TicketStatusBadge.jsx';
import TicketWhatsAppSection from './TicketWhatsAppSection.jsx';
import { formatLimaShort } from '../../shared/lib/time.js';
import { formatPEN } from '../../shared/lib/money.js';
import { ticketsApi } from '../api/ticketsApi.js';
import { useToast, useUnsavedGuard, DiscardChangesDialog } from '../../shared/ui/index.js';

const TIMELINE_STEPS = [
  { key: 'pendiente', label: 'Recepcionado' },
  { key: 'aprobado', label: 'Aprobado' },
  { key: 'trabajando', label: 'En taller' },
  { key: 'listo', label: 'Listo' },
  { key: 'entregado', label: 'Entregado' },
];

// Mirrors backend validateTransition (ADR 0007). `entregado → listo` is
// intentionally omitted: the backend does not reverse the recorded cobro.
const STATUS_TRANSITIONS = {
  pendiente: ['aprobado', 'cancelado'],
  aprobado: ['trabajando', 'pendiente', 'cancelado'],
  trabajando: ['listo', 'aprobado', 'cancelado'],
  listo: ['entregado', 'trabajando', 'abandonado'],
  entregado: [],
  cancelado: ['pendiente'],
  abandonado: ['entregado', 'cancelado'],
};

const TRANSITION_LABELS = {
  'aprobado→pendiente': 'Volver a Pendiente (devuelve piezas al stock)',
  'trabajando→aprobado': 'Volver a Aprobado',
  'listo→trabajando': 'Volver a En taller',
  'listo→abandonado': 'Marcar como Abandonado',
  'cancelado→pendiente': 'Reabrir ticket (Pendiente)',
};

const CLAVE_HIDE_MS = 30_000;

// Peruvian mobile numbers are 9 digits; the stored value normally omits the
// country code, but tolerate one that already carries it (`51` + 9 digits).
function toWhatsAppPhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('51')) return digits;
  return `51${digits}`;
}

function trackingUrl(ticket) {
  return `${window.location.origin}/ticket/${ticket.publicToken}`;
}

export default function TicketDetailDrawer({
  ticket,
  open,
  onClose,
  onStatusChange,
  onUpdateTicket,
}) {
  const { notify } = useToast();

  const [revealedClave, setRevealedClave] = useState(null);
  const [loadingClave, setLoadingClave] = useState(false);
  const [showClave, setShowClave] = useState(false);
  const [claveError, setClaveError] = useState('');
  const claveHideTimer = useRef(null);

  // Modals state
  const [showDlgAprobar, setShowDlgAprobar] = useState(false);
  const [showDlgErr, setShowDlgErr] = useState(false);
  const [stockError, setStockError] = useState(null); // { message, faltantes }
  const [showDlgEntregar, setShowDlgEntregar] = useState(false);
  const [showDlgComp, setShowDlgComp] = useState(false);
  const [showDlgCancel, setShowDlgCancel] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Delivery form state
  const [entregarMetodo, setEntregarMetodo] = useState('efectivo');
  const [motivoCancel, setMotivoCancel] = useState('Cliente no aprobó presupuesto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  // Internal notes
  const [nuevaNota, setNuevaNota] = useState('');
  const [isSavingNota, setIsSavingNota] = useState(false);

  const piezasRef = useRef(null);

  useEffect(() => () => clearTimeout(claveHideTimer.current), []);

  // Reset per-ticket UI state (clave visibility, dialogs) whenever the
  // drawer is opened for a different ticket.
  useEffect(() => {
    setRevealedClave(null);
    setShowClave(false);
    setClaveError('');
    clearTimeout(claveHideTimer.current);
    setShowStatusMenu(false);
  }, [ticket?.id]);

  // Unsaved-changes guard: this drawer is mostly read-only + actions, the
  // only typed input at risk of accidental loss is an unsent internal note
  // (odd/tasks/unsaved-changes-guard.md).
  const isDirty = nuevaNota.trim() !== '';
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        requestClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, requestClose]);

  if (!ticket || !open) return null;

  const total = Number(ticket.precioTotal || 0);
  const adelanto = Number(ticket.adelanto || 0);
  const isEntregado = ticket.estado === 'entregado';
  const saldo = isEntregado
    ? 0
    : ticket.saldo !== undefined
      ? Number(ticket.saldo)
      : Math.max(0, total - adelanto);
  const metodoAdelanto = ticket.metodoAdelanto || ticket.metodoPagoAdelanto;
  const clienteNombre = `${ticket.cliente?.nombre || ''} ${ticket.cliente?.apellido || ''}`.trim();
  const clienteTelefono = ticket.cliente?.telefono || ticket.cliente?.celular || '';
  const equipoModelo = ticket.equipo?.modelo || ticket.equipo?.celular || '';
  const equipoImei = ticket.equipo?.imei || ticket.equipo?.serialImei || '';
  const estadoIngreso = ticket.equipo?.estadoIngreso || ticket.diagnostico || '';

  // Calculate parts cost & profit
  const costoPiezas = (ticket.piezas || []).reduce(
    (sum, p) => sum + (Number(p.costoUnitario || 0) * Number(p.cantidad || 1)),
    0,
  );
  const ganancia = Math.max(0, total - costoPiezas);

  // Timeline computation
  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.key === ticket.estado);
  const timelineHistory = ticket.historialEstados || [];
  const allowedTransitions = STATUS_TRANSITIONS[ticket.estado] || [];

  async function handleToggleClave() {
    if (showClave) {
      setShowClave(false);
      clearTimeout(claveHideTimer.current);
      return;
    }
    setLoadingClave(true);
    setClaveError('');
    try {
      // Audited server-side per call — always re-request, never reuse a
      // previously revealed value.
      const res = await ticketsApi.revealClave(ticket.id);
      setRevealedClave(res);
      setShowClave(true);
      clearTimeout(claveHideTimer.current);
      claveHideTimer.current = setTimeout(() => setShowClave(false), CLAVE_HIDE_MS);
    } catch (err) {
      setClaveError(err?.message || 'No se pudo obtener la clave');
    } finally {
      setLoadingClave(false);
    }
  }

  async function handleConfirmAprobar() {
    setIsProcessing(true);
    setActionError('');
    try {
      await onStatusChange(ticket.id, { nuevoEstado: 'aprobado' });
      setShowDlgAprobar(false);
    } catch (err) {
      if (err?.code === 'insufficient_stock') {
        setStockError({ message: err.message, faltantes: err.details?.faltantes || [] });
        setShowDlgAprobar(false);
        setShowDlgErr(true);
      } else if (err?.code === 'ticket_modified') {
        // Parent already toasted + refetched; just close this dialog.
        setShowDlgAprobar(false);
      } else {
        setActionError(err?.message || 'Error al aprobar el ticket');
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmEntregar() {
    setIsProcessing(true);
    setActionError('');
    try {
      const payload = {
        nuevoEstado: 'entregado',
        cobro: saldo > 0 ? { metodo: entregarMetodo } : undefined,
      };
      await onStatusChange(ticket.id, payload);
      setShowDlgEntregar(false);
    } catch (err) {
      if (err?.code !== 'ticket_modified') {
        setActionError(err?.message || 'Error al entregar ticket');
      } else {
        setShowDlgEntregar(false);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmCancel() {
    setIsProcessing(true);
    setActionError('');
    try {
      await onStatusChange(ticket.id, { nuevoEstado: 'cancelado' });
      try {
        await ticketsApi.addNota(ticket.id, `Cancelado: ${motivoCancel}`);
      } catch {
        // Best-effort: the cancellation itself already succeeded.
      }
      setShowDlgCancel(false);
    } catch (err) {
      if (err?.code !== 'ticket_modified') {
        setActionError(err?.message || 'Error al cancelar ticket');
      } else {
        setShowDlgCancel(false);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDirectTransition(nuevoEstado) {
    setIsProcessing(true);
    setActionError('');
    try {
      await onStatusChange(ticket.id, { nuevoEstado });
    } catch (err) {
      if (err?.code !== 'ticket_modified') {
        setActionError(err?.message || 'Error al actualizar estado');
      }
    } finally {
      setIsProcessing(false);
    }
  }

  // Transitions with side effects (stock, cobro) go through their dialogs.
  function handleSelectTransition(nuevoEstado) {
    setShowStatusMenu(false);
    if (nuevoEstado === 'aprobado' && ticket.estado === 'pendiente') {
      setShowDlgAprobar(true);
    } else if (nuevoEstado === 'entregado') {
      setEntregarMetodo('efectivo');
      setShowDlgEntregar(true);
    } else if (nuevoEstado === 'cancelado') {
      setShowDlgCancel(true);
    } else {
      handleDirectTransition(nuevoEstado);
    }
  }

  async function handleAddNota() {
    if (!nuevaNota.trim()) return;
    setIsSavingNota(true);
    try {
      await ticketsApi.addNota(ticket.id, nuevaNota.trim());
      if (onUpdateTicket) {
        await onUpdateTicket(ticket.id);
      }
      setNuevaNota('');
    } catch (err) {
      setActionError(err?.message || 'Error al agregar nota');
    } finally {
      setIsSavingNota(false);
    }
  }

  function handleSendWhatsApp() {
    const waPhone = toWhatsAppPhone(clienteTelefono);
    const clientName = ticket.cliente?.nombre || 'estimado cliente';
    const publicUrl = trackingUrl(ticket);

    let msg = `Hola ${clientName}, te saludamos de ArmalyTech.\n`;
    msg += `Tu equipo *${ticket.equipo?.marca || ''} ${equipoModelo}* (Ticket *${ticket.codigo}*) está en estado: *${ticket.estado.toUpperCase()}*.\n`;
    if (ticket.estado === 'listo') {
      msg += `🎉 ¡Tu equipo ya está listo para ser retirado en tienda!\n`;
      if (saldo > 0) {
        msg += `Saldo pendiente a cancelar: ${formatPEN(saldo)}.\n`;
      }
    }
    msg += `\nPuedes consultar el detalle y avance en tiempo real en:\n${publicUrl}`;

    const waLink = `https://api.whatsapp.com/send/?phone=${waPhone}&text=${encodeURIComponent(msg)}`;
    window.open(waLink, '_blank', 'noopener,noreferrer');
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(trackingUrl(ticket));
      notify('Enlace copiado', { type: 'success' });
    } catch {
      notify('No se pudo copiar el enlace', { type: 'error' });
    }
  }

  function handlePrintReceipt() {
    window.print();
  }

  function goToPiezas() {
    setShowDlgErr(false);
    piezasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Parse pattern dots
  const patternSequence = (revealedClave?.tipo === 'patron' && revealedClave.valor)
    ? String(revealedClave.valor)
        .split(/[-,]/)
        .map((n) => parseInt(n.trim(), 10) - 1)
        .filter((n) => !isNaN(n))
    : [];

  return (
    <>
      {/* Drawer Overlay */}
      <div
        onClick={requestClose}
        className="fixed inset-0 z-50 flex justify-end bg-black/60 transition-opacity"
        role="dialog"
        aria-modal="true"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full max-w-[640px] flex-col overflow-y-auto sm:overflow-hidden border-l-4 border-accent bg-bg text-ink shadow-admin-lg"
        >
          {/* Drawer Top Header */}
          <div className="flex flex-col gap-3 px-4 sm:px-7 pt-5 pb-4 border-b-2 border-line shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[15px] font-bold text-accent-ink">
                {ticket.codigo}
              </span>
              <TicketStatusBadge estado={ticket.estado} />
              <button
                type="button"
                onClick={requestClose}
                aria-label="Cerrar"
                className="ml-auto flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-accent hover:text-accent-ink"
              >
                <X size={16} />
              </button>
            </div>

            <h2 className="text-[26px] font-extrabold tracking-tight leading-tight text-ink m-0">
              {ticket.titulo || `Reparación de ${ticket.equipo?.marca || ''} ${equipoModelo}`}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr] gap-3 text-[15px]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-muted">Cliente</span>
                <span className="font-bold text-ink">{clienteNombre}</span>
                <span className="text-sm text-muted font-mono tabular-nums">
                  +51 {clienteTelefono || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-muted">Equipo</span>
                <span className="font-bold text-ink">
                  {ticket.equipo?.marca} {equipoModelo}
                </span>
                <span className="text-sm text-muted">{equipoImei || '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-muted">Técnico</span>
                <span className="font-bold text-ink">
                  {ticket.tecnicoNombre || 'Sin asignar'}
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            {allowedTransitions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {ticket.estado === 'pendiente' && (
                  <button
                    type="button"
                    onClick={() => setShowDlgAprobar(true)}
                    className="btn btn-primary min-h-[46px] px-5 text-base gap-2.5 font-extrabold w-full sm:w-auto"
                  >
                    <span>Aprobar reparación</span>
                    <ArrowRight size={18} />
                  </button>
                )}

                {ticket.estado === 'aprobado' && (
                  <button
                    type="button"
                    onClick={() => handleDirectTransition('trabajando')}
                    disabled={isProcessing}
                    className="btn btn-primary min-h-[46px] px-5 text-base gap-2.5 font-extrabold w-full sm:w-auto"
                  >
                    <span>Iniciar trabajo</span>
                    <ArrowRight size={18} />
                  </button>
                )}

                {ticket.estado === 'trabajando' && (
                  <button
                    type="button"
                    onClick={() => handleDirectTransition('listo')}
                    disabled={isProcessing}
                    className="btn btn-primary min-h-[46px] px-5 text-base gap-2.5 font-extrabold w-full sm:w-auto"
                  >
                    <span>Marcar como listo</span>
                    <ArrowRight size={18} />
                  </button>
                )}

                {ticket.estado === 'listo' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEntregarMetodo('efectivo');
                      setShowDlgEntregar(true);
                    }}
                    className="btn btn-primary min-h-[46px] px-5 text-base gap-2.5 font-extrabold w-full sm:w-auto"
                  >
                    <span>Entregar y cobrar saldo</span>
                    <ArrowRight size={18} />
                  </button>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStatusMenu((v) => !v)}
                    disabled={isProcessing}
                    aria-haspopup="menu"
                    aria-expanded={showStatusMenu}
                    className="btn btn-secondary min-h-[46px] text-[15px] gap-2"
                  >
                    <span>Cambiar estado</span>
                    <ChevronDown size={16} />
                  </button>
                  {showStatusMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowStatusMenu(false)}
                      />
                      <div
                        role="menu"
                        className="absolute left-0 top-full z-20 mt-1 w-[min(280px,calc(100vw-2rem))] border border-line bg-surface shadow-admin-lg"
                      >
                        {allowedTransitions.map((estado) => (
                          <button
                            key={estado}
                            type="button"
                            role="menuitem"
                            onClick={() => handleSelectTransition(estado)}
                            className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-[15px] font-bold last:border-b-0 hover:bg-bg transition-colors ${
                              estado === 'cancelado' ? 'text-danger-ink' : 'text-ink'
                            }`}
                          >
                            <TicketStatusBadge estado={estado} />
                            <span>
                              {TRANSITION_LABELS[`${ticket.estado}→${estado}`] ||
                                `Pasar a ${TICKET_ESTADO_CONFIG[estado]?.label || estado}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {allowedTransitions.includes('cancelado') && (
                  <button
                    type="button"
                    onClick={() => setShowDlgCancel(true)}
                    className="min-h-[46px] px-4 bg-transparent border border-danger text-danger-ink font-bold text-[15px] cursor-pointer hover:bg-danger-bg transition-colors"
                  >
                    Cancelar ticket
                  </button>
                )}
              </div>
            )}

            {actionError && (
              <div className="text-xs text-danger-ink font-bold">{actionError}</div>
            )}
          </div>

          {/* Drawer Scrollable Body */}
          <div className="sm:flex-1 sm:overflow-y-auto px-4 sm:px-7 py-5 flex flex-col gap-5">
            {/* 1. 5-Step Timeline Bar */}
            <div className="grid grid-cols-5 border-t-2 border-line pt-2">
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx >= idx && ticket.estado !== 'cancelado';
                const isCurrent = ticket.estado === step.key;
                const hist = timelineHistory.find((h) => h.estado === step.key);
                return (
                  <div key={step.key} className="flex flex-col gap-1 pr-1 sm:pr-2 min-w-0">
                    <div
                      className={`h-1 w-full mb-1 transition-colors ${
                        isPassed ? 'bg-accent' : 'bg-line'
                      }`}
                    />
                    <span
                      className={`text-[11px] sm:text-[13px] leading-tight break-words ${
                        isCurrent
                          ? 'font-extrabold text-accent-ink'
                          : isPassed
                          ? 'font-bold text-ink'
                          : 'text-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                    {hist && (
                      <div className="flex flex-col text-xs text-muted tabular-nums leading-tight">
                        <span>{formatLimaShort(hist.fecha)}</span>
                        {hist.usuarioEmail && (
                          <span
                            className="text-[11px] truncate max-w-[90px]"
                            title={hist.usuarioEmail}
                          >
                            {hist.usuarioEmail.split('@')[0]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 2. 3-Column Price Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-2 border-ink">
              <div className="p-3 flex flex-col gap-0.5">
                <span className="text-[13px] text-muted">Total acordado</span>
                <span className="text-[22px] font-extrabold tabular-nums text-ink">
                  {formatPEN(total)}
                </span>
              </div>
              <div className="p-3 border-t sm:border-t-0 sm:border-l border-line flex flex-col gap-0.5">
                <span className="text-[13px] text-muted">Adelanto</span>
                <span className="text-[22px] font-extrabold tabular-nums text-ink">
                  {formatPEN(adelanto)}
                </span>
                <span className="text-[13px] text-muted capitalize">
                  {metodoAdelanto || '—'}
                </span>
              </div>
              <div className="p-3 border-t sm:border-t-0 sm:border-l border-line flex flex-col gap-0.5 bg-surface">
                <span className="text-[13px] text-muted">
                  {saldo === 0 ? 'Saldo cancelado' : 'Saldo pendiente'}
                </span>
                <span className="text-[22px] font-extrabold tabular-nums text-accent-ink">
                  {formatPEN(saldo)}
                </span>
                {isEntregado && (
                  <span className="text-[13px] text-muted capitalize">
                    {ticket.metodoSaldo || 'Pagado en entrega'}
                  </span>
                )}
              </div>
            </div>

            {/* 3. Solo panel strip */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 p-2.5 border border-dashed border-line text-[15px] bg-surface/40">
              <span className="text-xs font-extrabold tracking-wider uppercase px-2 py-0.5 bg-ink text-bg">
                Solo panel
              </span>
              <span>
                Costo de piezas <strong className="text-ink">{formatPEN(costoPiezas)}</strong>
              </span>
              <span className="text-muted">·</span>
              <span>
                Ganancia <strong className="text-ink">{formatPEN(ganancia)}</strong>
              </span>
            </div>

            {/* 4. 2-col info: Falla y Estado de ingreso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[15px] leading-relaxed">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] tracking-wider uppercase font-bold text-muted">
                  Falla reportada
                </span>
                <span className="text-ink font-medium">
                  {ticket.fallaReportada || ticket.equipo?.fallaReportada || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] tracking-wider uppercase font-bold text-muted">
                  Estado de ingreso
                </span>
                <span className="text-ink font-medium">{estadoIngreso || '—'}</span>
              </div>
            </div>

            {/* 5. Piezas */}
            <section ref={piezasRef} className="flex flex-col border-t-2 border-ink pt-3">
              <h3 className="m-0 mb-1.5 text-lg font-extrabold text-ink">Piezas</h3>
              {(!ticket.piezas || ticket.piezas.length === 0) ? (
                <div className="py-2 text-sm text-muted italic">Sin piezas asignadas.</div>
              ) : (
                ticket.piezas.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 py-2.5 border-b border-line text-[15px]"
                  >
                    <span className="flex-1 font-bold text-ink">
                      {p.nombre}{' '}
                      <span className="font-normal text-muted">× {p.cantidad}</span>
                    </span>
                    <span className="text-sm text-muted font-mono tabular-nums">
                      {formatPEN(p.costoUnitario)}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 uppercase tracking-wider ${
                        p.estado === 'descontada'
                          ? 'bg-accent text-on-accent'
                          : 'border border-line text-muted'
                      }`}
                    >
                      {p.estado === 'descontada' ? 'Descontado' : p.estado === 'devuelta' ? 'Devuelta' : 'Planificada'}
                    </span>
                  </div>
                ))
              )}
            </section>

            {/* 6. Clave del equipo */}
            <section className="flex flex-col gap-2.5 border-t-2 border-ink pt-3">
              <div className="flex items-center gap-2.5">
                <h3 className="m-0 text-lg font-extrabold text-ink">Clave del equipo</h3>
                <span className="text-xs font-bold px-2 py-0.5 border border-line uppercase">
                  {ticket.estado === 'entregado'
                    ? 'Borrada'
                    : ticket.estado === 'cancelado'
                      ? 'Borrada'
                      : ticket.claveEquipo?.tipo || 'ninguno'}
                </span>
                {ticket.estado !== 'entregado' &&
                  ticket.estado !== 'cancelado' &&
                  ticket.claveEquipo?.tipo &&
                  ticket.claveEquipo.tipo !== 'ninguno' && (
                    <button
                      type="button"
                      onClick={handleToggleClave}
                      disabled={loadingClave}
                      className="btn btn-secondary ml-auto min-h-[36px] text-sm gap-2"
                    >
                      {showClave ? <EyeOff size={15} /> : <Eye size={15} />}
                      <span>{loadingClave ? 'Cargando...' : showClave ? 'Ocultar clave' : 'Mostrar'}</span>
                    </button>
                  )}
              </div>

              {ticket.estado === 'entregado' ? (
                <span className="text-sm font-semibold text-muted italic">
                  Borrada al entregar
                </span>
              ) : ticket.estado === 'cancelado' ? (
                <span className="text-sm font-semibold text-muted italic">
                  Borrada al cancelar
                </span>
              ) : !ticket.claveEquipo?.tipo || ticket.claveEquipo.tipo === 'ninguno' ? (
                <span className="text-sm font-semibold text-muted italic">
                  Sin clave registrada
                </span>
              ) : !showClave ? (
                <span className="text-[22px] tracking-[0.3em] text-muted">••••••</span>
              ) : revealedClave?.tipo === 'patron' ? (
                <div className="flex flex-col gap-2 p-3 bg-surface border border-line">
                  <span className="text-sm font-bold text-ink">Patrón de desbloqueo:</span>
                  <div className="grid grid-cols-3 gap-2.5 w-fit">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                      const orderIdx = patternSequence.indexOf(i);
                      const isTapped = orderIdx >= 0;
                      return (
                        <div
                          key={i}
                          className={`flex h-[38px] w-[38px] items-center justify-center font-extrabold text-sm ${
                            isTapped
                              ? 'bg-accent text-on-accent'
                              : 'border border-line bg-bg text-muted'
                          }`}
                        >
                          {isTapped ? orderIdx + 1 : '·'}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-muted font-mono">
                    Secuencia: {patternSequence.map((n) => n + 1).join(' → ')}
                  </span>
                </div>
              ) : (
                <span className="text-[22px] font-bold tracking-[0.2em] font-mono text-ink">
                  {revealedClave?.valor || 'Sin clave'}
                </span>
              )}

              {claveError && <div className="text-xs text-danger-ink">{claveError}</div>}
              <span className="text-sm text-muted">
                Se guarda cifrada. Se muestra 30 s y se borra al entregar o cancelar el ticket.
              </span>
            </section>

            {/* 7. WhatsApp (plantillas) */}
            <TicketWhatsAppSection ticket={ticket} />

            {/* 8. Notas internas (Solo panel) */}
            <section className="flex flex-col gap-2.5 border-t-2 border-ink pt-3">
              <div className="flex items-center gap-2.5">
                <h3 className="m-0 text-lg font-extrabold text-ink">Notas internas</h3>
                <span className="text-[13px] text-muted">Solo panel</span>
              </div>

              {(ticket.notasInternas || []).length > 0 ? (
                ticket.notasInternas.map((n, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 p-2.5 bg-surface text-[15px] border border-line"
                  >
                    <span className="text-xs text-muted">Nota interna #{i + 1}</span>
                    <span className="text-ink">{n}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted italic">Sin notas registradas.</p>
              )}

              <div className="flex">
                <input
                  type="text"
                  placeholder="Escribe una nota para el equipo…"
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNota()}
                  className="min-w-0 flex-1 min-h-[44px] border border-line bg-surface px-3 text-[15px] text-ink outline-none border-r-0"
                />
                <button
                  type="button"
                  onClick={handleAddNota}
                  disabled={isSavingNota}
                  className="btn btn-secondary min-h-[44px] text-[15px] whitespace-nowrap"
                >
                  {isSavingNota ? 'Agregando...' : 'Agregar nota'}
                </button>
              </div>
            </section>

            {/* 9. Nota para el cliente */}
            {ticket.notaCliente && (
              <section className="flex flex-col gap-2 border-t-2 border-ink pt-3">
                <div className="flex items-center gap-2.5">
                  <h3 className="m-0 text-lg font-extrabold text-ink">Nota para el cliente</h3>
                  <span className="text-[13px] text-muted">Visible en su link</span>
                </div>
                <p className="m-0 p-3 border-t-[3px] border-accent bg-surface text-[15px] leading-relaxed text-ink">
                  {ticket.notaCliente}
                </p>
              </section>
            )}
          </div>

          {/* Drawer Bottom Footer */}
          <div className="flex flex-col gap-2 px-4 sm:px-7 py-3.5 border-t-2 border-ink shrink-0 bg-bg sm:flex-row sm:items-center">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="btn btn-secondary min-h-[46px] text-[15px] gap-2.5 w-full sm:w-auto"
              >
                <img
                  src="/assets/redes/whatsapp.svg"
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span>Abrir chat</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDlgComp(true)}
                className="btn btn-secondary min-h-[46px] text-[15px] w-full sm:w-auto"
              >
                Ver comprobante
              </button>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="sm:ml-auto text-[13px] text-muted font-mono truncate max-w-full sm:max-w-[220px] hover:text-accent-ink hover:underline"
              title="Copiar enlace de seguimiento"
            >
              {trackingUrl(ticket).replace(/^https?:\/\//, '')}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: dlgAprobar */}
      {showDlgAprobar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[520px] bg-bg text-ink border-t-4 border-accent shadow-admin-lg p-4 sm:p-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-accent-ink font-bold">
                {ticket.codigo}
              </span>
              <h2 className="text-xl sm:text-[26px] font-extrabold leading-tight text-ink m-0">
                Aprobar ticket
              </h2>
              <p className="text-base text-muted m-0 leading-relaxed">
                El cliente aprobó el precio de {formatPEN(total)}. Al aprobar se descontarán del stock disponible estas piezas planificadas:
              </p>
            </div>

            <div className="flex flex-col border-t-2 border-ink">
              {(ticket.piezas || []).map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-3 border-b border-line text-[15px]"
                >
                  <span className="flex-1 font-bold text-ink">
                    {p.nombre} × {p.cantidad}
                  </span>
                  <span className="font-mono text-muted tabular-nums">
                    Descuenta {p.cantidad} del stock
                  </span>
                </div>
              ))}
              {(!ticket.piezas || ticket.piezas.length === 0) && (
                <div className="py-3 text-sm text-muted italic">Sin piezas asignadas.</div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDlgAprobar(false)}
                className="btn btn-secondary min-h-[46px] text-[15px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAprobar}
                disabled={isProcessing}
                className="btn btn-primary min-h-[46px] px-5 text-[15px] font-bold"
              >
                {isProcessing ? 'Aprobando...' : 'Aprobar y descontar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: dlgErr — 409 insufficient_stock */}
      {showDlgErr && stockError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[520px] bg-bg text-ink border-t-4 border-danger shadow-admin-lg p-4 sm:p-7 flex flex-col gap-4">
            <div className="flex gap-3.5 items-start">
              <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center bg-danger-bg text-danger-ink">
                <AlertTriangle size={22} />
              </span>
              <div className="flex flex-col gap-1.5 min-w-0">
                <h2 className="text-xl sm:text-[26px] font-extrabold leading-tight text-ink m-0">
                  No se pudo aprobar {ticket.codigo}
                </h2>
                <p className="text-[17px] leading-tight text-danger-ink font-bold m-0">
                  {stockError.message}
                </p>
                <p className="text-sm text-muted m-0 leading-relaxed">
                  El ticket sigue en {ticket.estado === 'pendiente' ? 'Pendiente' : ticket.estado}: repón el stock o cambia la pieza.
                </p>
              </div>
            </div>

            {stockError.faltantes.length > 0 && (
              <div className="flex flex-col border-t-2 border-danger">
                {stockError.faltantes.map((f, idx) => (
                  <div
                    key={f.productoId || idx}
                    className="flex items-center gap-3 py-3 border-b border-line text-[15px] bg-danger-bg px-3"
                  >
                    <span className="flex-1 font-bold text-ink">{f.nombre}</span>
                    <span>
                      Necesitas <strong>{f.necesita}</strong>
                    </span>
                    <span>
                      Hay <strong className="text-danger-ink">{f.hay}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDlgErr(false)}
                className="btn btn-secondary min-h-[46px] text-[15px]"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={goToPiezas}
                className="btn btn-primary min-h-[46px] px-5 text-[15px] font-bold"
              >
                Cambiar pieza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: dlgEntregar */}
      {showDlgEntregar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[520px] bg-bg text-ink border-t-4 border-accent shadow-admin-lg p-4 sm:p-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-accent-ink font-bold">
                {ticket.codigo} · {ticket.cliente?.nombre}
              </span>
              <h2 className="text-xl sm:text-[26px] font-extrabold leading-tight text-ink m-0">
                Entregar y cobrar saldo
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.2fr] border-2 border-ink">
              <div className="p-3 flex flex-col gap-0.5">
                <span className="text-xs text-muted">Total</span>
                <span className="text-lg font-extrabold text-ink">{formatPEN(total)}</span>
              </div>
              <div className="p-3 border-t sm:border-t-0 sm:border-l border-line flex flex-col gap-0.5">
                <span className="text-xs text-muted">Adelanto</span>
                <span className="text-lg font-extrabold text-ink">{formatPEN(adelanto)}</span>
              </div>
              <div className="p-3 border-t sm:border-t-0 sm:border-l border-line flex flex-col gap-0.5 bg-accent text-[#0f172a]">
                <span className="text-xs font-bold">Saldo a cobrar</span>
                <span className="text-2xl font-extrabold">{formatPEN(saldo)}</span>
              </div>
            </div>

            {saldo > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted">Monto a cobrar</label>
                  <div className="flex border border-line">
                    <span className="flex items-center px-3 font-bold bg-surface border-r border-line text-ink">
                      S/
                    </span>
                    <span className="flex-1 min-w-0 h-[46px] flex items-center px-3 text-lg font-extrabold text-ink bg-surface/60">
                      {saldo.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-muted">Lo calcula el servidor, no se puede editar.</span>
                </div>

                <div className="grid grid-cols-2 border border-line h-[46px]">
                  <button
                    type="button"
                    onClick={() => setEntregarMetodo('efectivo')}
                    className={`font-bold text-sm transition-colors ${
                      entregarMetodo === 'efectivo'
                        ? 'bg-ink text-bg'
                        : 'bg-transparent text-ink hover:bg-surface'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntregarMetodo('yape')}
                    className={`font-bold text-sm border-l border-line transition-colors ${
                      entregarMetodo === 'yape'
                        ? 'bg-ink text-bg'
                        : 'bg-transparent text-ink hover:bg-surface'
                    }`}
                  >
                    Yape
                  </button>
                </div>
              </div>
            )}

            <p className="text-[15px] leading-relaxed text-muted m-0">
              Se registra en Historial de caja como «Saldo {ticket.codigo}», suma +1 sello para{' '}
              {ticket.cliente?.nombre || 'el cliente'} y la clave del equipo se borra permanentemente.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDlgEntregar(false)}
                className="btn btn-secondary min-h-[46px] text-[15px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEntregar}
                disabled={isProcessing}
                className="btn btn-primary min-h-[46px] px-5 text-[15px] font-bold"
              >
                {isProcessing ? 'Cobrando...' : 'Cobrar y entregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: dlgCancel */}
      {showDlgCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[520px] bg-bg text-ink border-t-4 border-danger shadow-admin-lg p-4 sm:p-7 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-danger-bg text-danger-ink">
                <AlertTriangle size={22} />
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs uppercase tracking-[0.14em] text-danger-ink font-bold">
                  {ticket.codigo}
                </span>
                <h2 className="text-xl sm:text-[24px] font-extrabold leading-tight text-ink m-0">
                  Cancelar orden de servicio
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-ink">Motivo de cancelación:</label>
              <select
                value={motivoCancel}
                onChange={(e) => setMotivoCancel(e.target.value)}
                className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none"
              >
                <option value="Cliente no aprobó presupuesto">Cliente no aprobó presupuesto</option>
                <option value="Repuesto no disponible o descatalogado">Repuesto no disponible o descatalogado</option>
                <option value="Equipo sin solución técnica (placa irreversible)">Equipo sin solución técnica (placa irreversible)</option>
                <option value="Desistimiento voluntario del cliente">Desistimiento voluntario del cliente</option>
              </select>
              <p className="text-xs text-muted">
                Si las piezas ya habían sido descontadas del inventario, se devolverán automáticamente al stock disponible.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDlgCancel(false)}
                className="btn btn-secondary min-h-[46px] text-[15px]"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isProcessing}
                className="min-h-[46px] px-5 bg-danger text-white font-bold text-[15px]"
              >
                {isProcessing ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: dlgComp Comprobante de servicio */}
      {showDlgComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[500px] max-h-[860px] flex flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0f172a] text-[#e2e8f0] shrink-0">
              <span className="text-[13px] uppercase tracking-[0.14em] font-bold text-[#fdba74]">
                Comprobante de servicio
              </span>
              <button
                type="button"
                onClick={() => setShowDlgComp(false)}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center border border-white/20 text-white hover:border-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Receipt body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-7 py-6 flex flex-col gap-4 text-[#0f172a]">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/Armalytech_logo.png"
                  alt="ArmalyTech"
                  className="w-11 h-11 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-extrabold">ArmalyTech</span>
                  <span className="text-[13px] text-slate-500">
                    Av. San Luis 1849-1851, San Borja · MultiMercado San Borja
                  </span>
                  <span className="text-[13px] text-slate-500">WhatsApp +51 924 548 268</span>
                </div>
              </div>

              <div className="border-t-2 border-[#0f172a] pt-3 flex flex-col gap-1">
                <span className="text-2xl font-extrabold tracking-wide">
                  TICKET {ticket.codigo}
                </span>
                <span className="text-base font-bold text-slate-700">
                  {ticket.titulo || `Reparación ${ticket.equipo?.marca || ''} ${equipoModelo}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm leading-snug">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Cliente</span>
                  <span className="font-bold">{clienteNombre}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Equipo</span>
                  <span className="font-bold">
                    {ticket.equipo?.marca} {equipoModelo}
                  </span>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <span className="text-slate-500 text-xs">Falla</span>
                  <span className="font-bold">
                    {ticket.equipo?.fallaReportada || ticket.fallaReportada || '—'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Técnico</span>
                  <span className="font-bold">{ticket.tecnicoNombre || 'Sin asignar'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Fecha</span>
                  <span className="font-bold">{formatLimaShort(ticket.fechaIngreso || ticket.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-col border-t-2 border-[#0f172a] text-[15px]">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="font-bold">Total del servicio</span>
                  <span className="font-extrabold tabular-nums">{formatPEN(total)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 text-sm">
                  <span>Adelanto{metodoAdelanto ? ` · ${metodoAdelanto}` : ''}</span>
                  <span className="tabular-nums">{formatPEN(adelanto)}</span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-[#0f172a] text-sm">
                  <span>{isEntregado ? 'Total cancelado' : 'Saldo a pagar'}</span>
                  <span className="font-extrabold tabular-nums">
                    {formatPEN(isEntregado ? total : saldo)}
                  </span>
                </div>
                {isEntregado && (
                  <div className="flex justify-between py-1.5 text-xs text-slate-500">
                    <span>
                      {ticket.fechaEntregaReal
                        ? `Entregado el ${formatLimaShort(ticket.fechaEntregaReal)}`
                        : 'Entregado'}
                      {ticket.metodoSaldo ? ` · ${ticket.metodoSaldo}` : ''}
                    </span>
                    <span className="font-semibold text-emerald-600">Saldo S/ 0.00</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-100 text-xs leading-relaxed text-slate-700">
                <strong>Garantía:</strong> 30 días sobre la pieza cambiada. No cubre golpes, humedad ni equipos abiertos por terceros.
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-20 h-20 flex-none flex items-center justify-center border border-slate-300 bg-white p-1">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trackingUrl(ticket))}`}
                    alt="Código QR de seguimiento"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1 text-sm">
                  <span className="font-bold">Sigue tu reparación</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="max-w-full truncate font-mono text-xs text-slate-600 text-left hover:underline"
                  >
                    {trackingUrl(ticket).replace(/^https?:\/\//, '')}
                  </button>
                </div>
              </div>

              <p className="m-0 pt-2 border-t border-slate-200 text-xs text-slate-400">
                Comprobante de servicio técnico, no constituye comprobante de pago SUNAT.
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 px-4 sm:px-7 py-3.5 border-t-2 border-[#0f172a] shrink-0 bg-slate-50 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="btn btn-secondary min-h-[46px] text-sm gap-2"
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="min-h-[46px] flex items-center gap-2 px-4 bg-[#f97316] font-extrabold text-[15px] cursor-pointer"
                >
                  <span>Abrir chat</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowDlgComp(false)}
                className="btn btn-secondary sm:ml-auto min-h-[46px] text-[15px] w-full sm:w-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <DiscardChangesDialog open={confirmOpen} onCancel={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
