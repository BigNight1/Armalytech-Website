import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Lock, X } from 'lucide-react';
import { clientsApi } from '../../clients/api/clientsApi.js';
import { ticketsApi } from '../api/ticketsApi.js';
import { useTechnicians } from '../hooks/useTechnicians.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { useBrands } from '../../inventory/hooks/useBrands.js';
import { usePhones } from '../../inventory/hooks/usePhones.js';
import { useCategories } from '../../inventory/hooks/useCategories.js';
import { formatPEN } from '../../shared/lib/money.js';
import LoyaltyStamps from '../../clients/components/LoyaltyStamps.jsx';
import { useUnsavedGuard, DiscardChangesDialog } from '../../shared/ui/index.js';

// D3: Orden 1 Cliente -> 2 Equipo -> 3 Precio y cierre -> 4 Piezas
const STEPS = [
  { id: 1, num: '01', label: 'Cliente' },
  { id: 2, num: '02', label: 'Equipo' },
  { id: 3, num: '03', label: 'Precio' },
  { id: 4, num: '04', label: 'Piezas' },
];

const CLAVE_OPTIONS = [
  ['ninguno', 'Sin bloqueo'],
  ['pin', 'PIN'],
  ['contrasena', 'Contraseña'],
  ['patron', 'Patrón'],
];

/** "Pantallas" -> "pantalla" for the auto-generated title. */
function singularizeCategory(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  const singular = trimmed.endsWith('s') ? trimmed.slice(0, -1) : trimmed;
  return singular.toLowerCase();
}

function availabilityMeta(item) {
  if (item.disponible > 0) {
    const planned = item.planificado > 0 ? ` · ${item.planificado} planificada en ${item.reservas?.[0]?.codigo ?? '—'}` : '';
    return `Stock ${item.stock}${planned} · ${item.disponible} disponibles`;
  }
  const reserva = item.reservas?.[0];
  return reserva ? `Reservada para ${reserva.codigo} (${reserva.cliente})` : 'Sin stock';
}

export default function NewTicketDrawer({ open, onClose, onSubmit }) {
  const { activeTechnicians } = useTechnicians();
  const { brands } = useBrands();
  const { phones, createPhone } = usePhones();
  const { categories } = useCategories();

  // Active step / scroll tracking
  const [activeStep, setActiveStep] = useState(1);
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const step4Ref = useRef(null);

  // 1. Cliente
  const [phone, setPhone] = useState('');
  const [searchingClient, setSearchingClient] = useState(false);
  const [matchedClient, setMatchedClient] = useState(null);
  const [clientActiveTicket, setClientActiveTicket] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  // 2. Equipo — free typing with suggestions & normalization
  const [marcaId, setMarcaId] = useState('');
  const [celularId, setCelularId] = useState('');
  const [marcaInput, setMarcaInput] = useState('');
  const [modeloInput, setModeloInput] = useState('');
  const [color, setColor] = useState('');
  const [imei, setImei] = useState('');
  const [fallaReportada, setFallaReportada] = useState('');
  const [estadoIngreso, setEstadoIngreso] = useState('');

  // Clave del equipo — defaults to "sin bloqueo"
  const [tipoClave, setTipoClave] = useState('ninguno');
  const [patronSequence, setPatronSequence] = useState([]);
  const [pinValue, setPinValue] = useState('');
  const [txtValue, setTxtValue] = useState('');

  // 3. Precio y Cierre (moved before Piezas per D3)
  const [titulo, setTitulo] = useState('');
  const [tituloTouched, setTituloTouched] = useState(false);
  const [precio, setPrecio] = useState('');
  const [adelanto, setAdelanto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tecnicoId, setTecnicoId] = useState('');
  const [notaCliente, setNotaCliente] = useState('');

  // 4. Piezas (search & category autocompletion)
  const [categoriaId, setCategoriaId] = useState('');
  const [categoriaQuery, setCategoriaQuery] = useState('');
  const [piezaQuery, setPiezaQuery] = useState('');
  const [selectedPiezas, setSelectedPiezas] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedMarca = useMemo(() => {
    if (marcaId) return brands.find((b) => b.id === marcaId) || null;
    if (marcaInput.trim()) {
      return brands.find((b) => b.name.toLowerCase() === marcaInput.trim().toLowerCase()) || null;
    }
    return null;
  }, [brands, marcaId, marcaInput]);

  const marcaPhones = useMemo(() => {
    const bId = selectedMarca?.id || marcaId;
    return bId ? phones.filter((p) => p.brandId === bId) : phones;
  }, [phones, selectedMarca, marcaId]);

  const selectedPhone = useMemo(() => {
    if (celularId) return phones.find((p) => p.id === celularId) || null;
    if (modeloInput.trim()) {
      const match = marcaPhones.find((p) => p.name.toLowerCase() === modeloInput.trim().toLowerCase());
      if (match) return match;
      return phones.find((p) => p.name.toLowerCase() === modeloInput.trim().toLowerCase()) || null;
    }
    return null;
  }, [phones, marcaPhones, celularId, modeloInput]);

  const { items: availabilityItems, isLoading: loadingAvailability } = useAvailability({
    categoriaId: categoriaId || undefined,
    celularId: selectedPhone?.id || undefined,
    q: piezaQuery.trim() || undefined,
    categoria: categoriaQuery.trim() || undefined,
  });

  // Reset drawer state when reopened
  useEffect(() => {
    if (!open) return;
    setActiveStep(1);
    setPhone('');
    setSearchingClient(false);
    setMatchedClient(null);
    setClientActiveTicket(null);
    setFirstName('');
    setLastName('');
    setMarketingConsent(false);
    setMarcaId('');
    setCelularId('');
    setMarcaInput('');
    setModeloInput('');
    setColor('');
    setImei('');
    setFallaReportada('');
    setEstadoIngreso('');
    setTipoClave('ninguno');
    setPatronSequence([]);
    setPinValue('');
    setTxtValue('');
    setCategoriaId('');
    setCategoriaQuery('');
    setPiezaQuery('');
    setSelectedPiezas([]);
    setTitulo('');
    setTituloTouched(false);
    setPrecio('');
    setAdelanto('');
    setMetodoPago('efectivo');
    setTecnicoId('');
    setNotaCliente('');
    setErrorMsg('');
  }, [open]);

  // Phone lookup with auto-discovery of active tickets
  async function handlePhoneChange(value) {
    const clean = value.replace(/\D/g, '');
    setPhone(clean);
    if (clean.length !== 9) {
      setMatchedClient(null);
      setClientActiveTicket(null);
      return;
    }
    setSearchingClient(true);
    setErrorMsg('');
    try {
      const res = await clientsApi.listClients({ q: clean, limit: 1 });
      const items = res?.items || res || [];
      if (items.length > 0) {
        const c = items[0];
        setMatchedClient(c);
        setFirstName(c.firstName || '');
        setLastName(c.lastName || '');
        setMarketingConsent(Boolean(c.marketingConsent));

        try {
          const tkRes = await ticketsApi.listTickets({ q: clean, limit: 5 });
          const list = tkRes?.items || tkRes?.tickets || [];
          const active = list.find(
            (t) =>
              (t.cliente?.clienteId === c.id || t.cliente?.telefono === clean) &&
              t.estado !== 'entregado' &&
              t.estado !== 'cancelado',
          );
          setClientActiveTicket(active || null);
        } catch {
          setClientActiveTicket(null);
        }
      } else {
        setMatchedClient(null);
        setClientActiveTicket(null);
      }
    } catch {
      setMatchedClient(null);
      setClientActiveTicket(null);
    } finally {
      setSearchingClient(false);
    }
  }

  async function handleAddPhone() {
    const brandName = selectedMarca?.name || marcaInput.trim();
    if (!brandName) {
      setErrorMsg('Selecciona o escribe una marca antes de agregar un celular.');
      return;
    }
    const name = window.prompt(`Nombre del nuevo modelo para ${brandName}:`);
    if (!name || !name.trim()) return;
    try {
      const bId = selectedMarca?.id;
      if (bId) {
        const created = await createPhone(bId, name.trim());
        setCelularId(created.id);
        setModeloInput(created.name);
      } else {
        // Brand is also newly typed: set text directly, will resolve on save
        setModeloInput(name.trim());
      }
    } catch {
      // usePhones() toasts on error
    }
  }

  // Pattern gesture handling
  const [isDrawingPatron, setIsDrawingPatron] = useState(false);

  function addDotToPattern(index) {
    if (errorMsg.includes('patrón')) setErrorMsg('');
    setPatronSequence((prev) => (prev.includes(index) ? prev : [...prev, index]));
  }

  function handlePatternPointerDown(e) {
    if (typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setIsDrawingPatron(true);
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const dotEl = target?.closest('[data-dot-idx]');
    if (dotEl) {
      const idx = parseInt(dotEl.getAttribute('data-dot-idx'), 10);
      if (!isNaN(idx)) {
        if (errorMsg.includes('patrón')) setErrorMsg('');
        setPatronSequence([idx]);
      }
    }
  }

  function handlePatternPointerMove(e) {
    if (!isDrawingPatron) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const dotEl = target?.closest('[data-dot-idx]');
    if (dotEl) {
      const idx = parseInt(dotEl.getAttribute('data-dot-idx'), 10);
      if (!isNaN(idx)) addDotToPattern(idx);
    }
  }

  function handlePatternPointerUp(e) {
    if (typeof e.currentTarget.releasePointerCapture === 'function' && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDrawingPatron(false);
  }

  function handleClearPatron() {
    setPatronSequence([]);
    setIsDrawingPatron(false);
  }

  // Auto-generate title when adding pieces
  function maybeAutoTitle(categoryName) {
    if (tituloTouched) return;
    const singular = singularizeCategory(categoryName);
    const modelName = selectedPhone?.name || modeloInput.trim() || '';
    if (!singular || !modelName) return;
    setTitulo(`Reparación de ${singular} ${modelName}`.trim());
  }

  function handleAddPiece(item) {
    const categoryName = categories.find((c) => c.id === categoriaId)?.name || item.categoria || categoriaQuery;
    setSelectedPiezas((prev) => {
      const exists = prev.find((p) => p.productoId === item.productoId);
      if (exists) {
        return prev.map((p) =>
          p.productoId === item.productoId
            ? { ...p, cantidad: Math.min(p.cantidad + 1, p.disponible) }
            : p,
        );
      }
      return [
        ...prev,
        {
          productoId: item.productoId,
          nombre: item.nombre,
          categoria: categoryName,
          cantidad: 1,
          costoUnitario: item.costo,
          disponible: item.disponible,
        },
      ];
    });
    maybeAutoTitle(categoryName);
  }

  function handleDecPiece(id) {
    setSelectedPiezas((prev) =>
      prev.map((p) => (p.productoId === id ? { ...p, cantidad: p.cantidad - 1 } : p)).filter((p) => p.cantidad > 0),
    );
  }

  function handleIncPiece(id) {
    setSelectedPiezas((prev) =>
      prev.map((p) => (p.productoId === id ? { ...p, cantidad: Math.min(p.cantidad + 1, p.disponible) } : p)),
    );
  }

  function handleRemovePiece(id) {
    setSelectedPiezas((prev) => prev.filter((p) => p.productoId !== id));
  }

  // Calculations
  const costoTotal = selectedPiezas.reduce((sum, p) => sum + p.costoUnitario * p.cantidad, 0);
  const numPrecio = Number(precio) || 0;
  const numAdelanto = Number(adelanto) || 0;
  const saldo = Math.max(0, numPrecio - numAdelanto);
  const ganancia = numPrecio - costoTotal;

  function claveValidationError() {
    if (tipoClave === 'pin' && !pinValue.trim()) return 'Ingresa el PIN.';
    if (tipoClave === 'contrasena' && !txtValue.trim()) return 'Ingresa la contraseña.';
    if (tipoClave === 'patron' && patronSequence.length < 4) return 'Dibuja el patrón (mínimo 4 puntos).';
    return '';
  }

  async function handleCreateTicket() {
    if (!phone || phone.length < 9) {
      setErrorMsg('Ingresa un teléfono válido de 9 dígitos.');
      scrollToStep(1);
      return;
    }
    if (!matchedClient && !firstName.trim()) {
      setErrorMsg('Ingresa el nombre del cliente.');
      scrollToStep(1);
      return;
    }
    const marcaName = selectedMarca?.name || marcaInput.trim();
    const modeloName = selectedPhone?.name || modeloInput.trim();
    if (!marcaName) {
      setErrorMsg('Selecciona o escribe la marca del equipo.');
      scrollToStep(2);
      return;
    }
    if (!modeloName) {
      setErrorMsg('Selecciona o escribe el modelo del equipo.');
      scrollToStep(2);
      return;
    }
    if (!fallaReportada.trim()) {
      setErrorMsg('Ingresa la falla reportada.');
      scrollToStep(2);
      return;
    }
    const claveError = claveValidationError();
    if (claveError) {
      setErrorMsg(claveError);
      scrollToStep(2);
      return;
    }
    if (numPrecio <= 0) {
      setErrorMsg('El precio acordado debe ser mayor a 0.');
      scrollToStep(3);
      return;
    }

    let claveEquipo = { tipo: tipoClave };
    if (tipoClave === 'patron') {
      claveEquipo.valor = patronSequence.map((i) => i + 1).join('-');
    } else if (tipoClave === 'pin') {
      claveEquipo.valor = pinValue.trim();
    } else if (tipoClave === 'contrasena') {
      claveEquipo.valor = txtValue.trim();
    }

    const tecnico = activeTechnicians.find((t) => t.id === tecnicoId) || null;

    const payload = {
      cliente: {
        clienteId: matchedClient?.id || undefined,
        nombre: firstName.trim(),
        apellido: lastName.trim() || undefined,
        telefono: phone,
      },
      equipo: {
        marcaId: selectedMarca?.id || undefined,
        celularId: selectedPhone?.id || undefined,
        marca: marcaName,
        modelo: modeloName,
        color: color.trim() || undefined,
        imei: imei.trim() || undefined,
        fallaReportada: fallaReportada.trim(),
        estadoIngreso: estadoIngreso.trim() || undefined,
      },
      claveEquipo,
      titulo: titulo.trim() || `Reparación ${modeloName}`.trim(),
      tecnicoId: tecnico?.id || undefined,
      tecnicoNombre: tecnico?.nombre || undefined,
      piezas: selectedPiezas.map((p) => ({
        productoId: p.productoId,
        nombre: p.nombre,
        categoria: p.categoria,
        cantidad: p.cantidad,
        costoUnitario: p.costoUnitario,
      })),
      precioTotal: numPrecio,
      adelanto: numAdelanto > 0 ? numAdelanto : undefined,
      metodoAdelanto: numAdelanto > 0 ? metodoPago : undefined,
      notaCliente: notaCliente.trim() || undefined,
    };

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Error al crear el ticket.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function scrollToStep(stepNum) {
    setActiveStep(stepNum);
    const refs = { 1: step1Ref, 2: step2Ref, 3: step3Ref, 4: step4Ref };
    refs[stepNum]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Unsaved-changes guard: dirty when any client/equipment/price/parts
  // field has been touched (odd/tasks/unsaved-changes-guard.md).
  const isDirty =
    phone !== '' ||
    firstName.trim() !== '' ||
    lastName.trim() !== '' ||
    marcaInput.trim() !== '' ||
    modeloInput.trim() !== '' ||
    color.trim() !== '' ||
    imei.trim() !== '' ||
    fallaReportada.trim() !== '' ||
    estadoIngreso.trim() !== '' ||
    tipoClave !== 'ninguno' ||
    patronSequence.length > 0 ||
    pinValue !== '' ||
    txtValue !== '' ||
    titulo.trim() !== '' ||
    precio !== '' ||
    adelanto !== '' ||
    tecnicoId !== '' ||
    notaCliente.trim() !== '' ||
    selectedPiezas.length > 0;
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

  if (!open) return null;

  return (
    <>
    <div
      onClick={requestClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[640px] flex-col border-l-4 border-accent bg-bg text-ink shadow-admin-lg"
      >
        {/* Drawer Header */}
        <div className="flex h-20 shrink-0 items-center justify-between gap-4 px-4 sm:px-7 border-b border-line">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">
              Tickets · Nuevo
            </span>
            <h2 className="text-xl sm:text-[26px] font-extrabold leading-none text-ink truncate">
              Nuevo ticket
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-accent hover:text-accent-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* 4 Steps Stepper Bar */}
        <div className="grid grid-cols-4 border-b-2 border-line shrink-0">
          {STEPS.map((s, idx) => {
            const isActive = activeStep === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToStep(s.id)}
                className={`flex items-center justify-center gap-1 sm:justify-start sm:gap-2 py-3 px-1 sm:px-3 text-xs sm:text-[15px] font-bold transition-colors ${
                  idx > 0 ? 'border-l border-line' : ''
                } ${
                  isActive
                    ? 'border-t-[3px] border-accent text-ink bg-surface/30'
                    : 'border-t-[3px] border-transparent text-muted hover:text-ink'
                }`}
              >
                <span className="text-xs font-mono font-bold text-muted">{s.num}</span>
                <span className="hidden truncate sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Content */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 sm:px-7 py-4">
          {errorMsg && (
            <div className="flex items-center gap-2 border border-danger bg-danger-bg p-3 text-sm text-danger-ink">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 01 CLIENTE */}
          <section ref={step1Ref} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-extrabold text-accent-ink">01</span>
              <h3 className="text-xl font-extrabold text-ink">Cliente</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted">Teléfono del cliente</label>
              <div className="flex items-stretch border border-line bg-surface">
                <span className="flex items-center px-3 text-base font-bold text-ink bg-line/20 border-r border-line">
                  +51
                </span>
                <input
                  type="text"
                  maxLength={9}
                  inputMode="numeric"
                  placeholder="987 654 321"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="flex-1 min-w-0 h-12 border-0 bg-transparent px-3 text-[17px] font-semibold font-mono text-ink outline-none"
                />
                {searchingClient && (
                  <span className="flex items-center px-3 my-1.5 mr-1.5 text-xs font-bold border border-line text-muted">
                    Buscando...
                  </span>
                )}
                {!searchingClient && phone.length === 9 && (
                  <span
                    className={`flex items-center px-3 my-1.5 mr-1.5 text-xs font-extrabold uppercase tracking-wider ${
                      matchedClient
                        ? 'bg-accent text-on-accent'
                        : 'border border-line text-muted'
                    }`}
                  >
                    {matchedClient ? 'Encontrado' : 'Cliente nuevo'}
                  </span>
                )}
              </div>
            </div>

            {/* Existing Customer Card */}
            {matchedClient && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3.5 p-3.5 bg-surface border border-line">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink text-bg text-base font-extrabold">
                    {matchedClient.firstName?.[0]}
                    {matchedClient.lastName?.[0]}
                  </span>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-[17px] font-extrabold text-ink truncate">
                      {matchedClient.firstName} {matchedClient.lastName}
                    </span>
                    <span className="text-sm text-muted">
                      {matchedClient.visitCount ?? 0} visitas
                    </span>
                  </div>
                  <LoyaltyStamps stamps={matchedClient.stamps ?? 0} size="sm" />
                </div>

                {/* Banner: Has a ticket in progress */}
                {clientActiveTicket && (
                  <div className="flex items-start gap-3 p-3.5 border-t-2 border-accent bg-accent-100 text-accent-900">
                    <AlertCircle size={18} className="shrink-0 text-accent-ink mt-0.5" />
                    <div className="flex flex-col gap-1 text-[15px] flex-1">
                      <span className="font-extrabold text-accent-900">Tiene un ticket en curso</span>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="font-mono font-bold">{clientActiveTicket.codigo}</span>
                        <span>{clientActiveTicket.titulo}</span>
                        <span className="bg-accent text-on-accent px-2 py-0.5 text-xs font-bold uppercase">
                          {clientActiveTicket.estado}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`/admin/tickets?q=${clientActiveTicket.codigo}`}
                      className="text-sm font-bold text-accent-ink hover:underline shrink-0"
                    >
                      Ver ticket
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* New Customer Fields */}
            {!matchedClient && phone.length === 9 && (
              <div className="flex flex-col gap-3.5">
                <p className="text-sm text-muted">
                  No encontramos este número. Completa sus datos y lo creamos junto con el ticket.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted">Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej. Andrés"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted">Apellido</label>
                    <input
                      type="text"
                      placeholder="Ej. Vega"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="h-4 w-4 accent-accent"
                  />
                  <span>Acepta promociones por WhatsApp</span>
                </label>
              </div>
            )}
          </section>

          {/* 02 EQUIPO Y PROBLEMA */}
          <section ref={step2Ref} className="flex flex-col gap-3 border-t-2 border-line pt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-extrabold text-accent-ink">02</span>
              <h3 className="text-xl font-extrabold text-ink">Equipo y problema</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">Marca (escribe o elige)</label>
                <input
                  type="text"
                  list="brand-suggestions"
                  placeholder="Ej. Samsung, Apple..."
                  value={marcaInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMarcaInput(val);
                    const match = brands.find((b) => b.name.toLowerCase() === val.trim().toLowerCase());
                    setMarcaId(match ? match.id : '');
                  }}
                  className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
                <datalist id="brand-suggestions">
                  {brands.map((b) => (
                    <option key={b.id} value={b.name} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">Modelo (escribe o elige)</label>
                <input
                  type="text"
                  list="phone-suggestions"
                  placeholder="Ej. Galaxy A53, iPhone 13..."
                  value={modeloInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModeloInput(val);
                    const match = marcaPhones.find((p) => p.name.toLowerCase() === val.trim().toLowerCase());
                    setCelularId(match ? match.id : '');
                    if (!piezaQuery || piezaQuery === modeloInput) {
                      setPiezaQuery(val);
                    }
                  }}
                  className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
                <datalist id="phone-suggestions">
                  {marcaPhones.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>

              <button
                type="button"
                onClick={handleAddPhone}
                className="h-11 px-3 border border-line bg-surface text-sm font-semibold text-ink whitespace-nowrap hover:border-accent hover:text-accent-ink"
              >
                + Agregar celular
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">Color (opcional)</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">IMEI (opcional)</label>
                <input
                  type="text"
                  placeholder="352098114023371"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="h-11 border border-line bg-surface px-3 text-[15px] font-mono text-ink tabular-nums focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">Falla reportada</label>
              <textarea
                rows={3}
                placeholder="Pantalla rota tras una caída; el táctil no responde en la parte inferior."
                value={fallaReportada}
                onChange={(e) => setFallaReportada(e.target.value)}
                className="w-full border border-line bg-surface p-2.5 text-[15px] text-ink focus:outline-none focus:border-accent resize-none leading-snug"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">Estado de ingreso (opcional)</label>
              <input
                type="text"
                placeholder="Ej. Tapa trasera rajada, sin chip y sin funda"
                value={estadoIngreso}
                onChange={(e) => setEstadoIngreso(e.target.value)}
                className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
              />
            </div>

            {/* Clave del equipo: 4 Segments */}
            <div className="flex flex-col gap-2.5 pt-1">
              <span className="text-sm text-muted">Clave del equipo</span>
              <div className="grid grid-cols-4 border border-line">
                {CLAVE_OPTIONS.map(([key, label], idx) => {
                  const isSel = tipoClave === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTipoClave(key)}
                      className={`h-11 truncate px-1 text-xs sm:text-[15px] font-bold transition-colors ${
                        idx > 0 ? 'border-l border-line' : ''
                      } ${
                        isSel
                          ? 'bg-ink text-bg'
                          : 'bg-transparent text-ink hover:bg-surface'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Patrón 3x3 Grid */}
              {tipoClave === 'patron' && (
                <div
                  className="flex flex-wrap items-center gap-6 p-4 bg-surface border border-line select-none"
                  onPointerUp={handlePatternPointerUp}
                  onPointerCancel={handlePatternPointerUp}
                  onPointerLeave={handlePatternPointerUp}
                >
                  <div
                    className="relative w-[184px] h-[184px] select-none touch-none cursor-crosshair"
                    onPointerDown={handlePatternPointerDown}
                    onPointerMove={handlePatternPointerMove}
                    onPointerUp={handlePatternPointerUp}
                  >
                    <svg className="absolute inset-0 pointer-events-none w-[184px] h-[184px] z-0">
                      {patronSequence.slice(0, -1).map((dotIdx, k) => {
                        const nextIdx = patronSequence[k + 1];
                        const x1 = (dotIdx % 3) * 66 + 26;
                        const y1 = Math.floor(dotIdx / 3) * 66 + 26;
                        const x2 = (nextIdx % 3) * 66 + 26;
                        const y2 = Math.floor(nextIdx / 3) * 66 + 26;
                        return (
                          <line
                            key={`${dotIdx}-${nextIdx}-${k}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="var(--color-accent, #f97316)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            opacity="0.9"
                          />
                        );
                      })}
                    </svg>

                    <div className="grid grid-cols-3 gap-[14px] w-[184px] h-[184px] relative z-10 pointer-events-none">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                        const orderIdx = patronSequence.indexOf(i);
                        const isTapped = orderIdx >= 0;
                        return (
                          <div
                            key={i}
                            data-dot-idx={i}
                            className={`flex h-[52px] w-[52px] items-center justify-center font-extrabold text-lg select-none transition-transform pointer-events-auto ${
                              isTapped
                                ? 'bg-accent text-on-accent border-2 border-accent shadow-sm scale-105'
                                : 'bg-bg border-2 border-line text-muted hover:border-accent'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              addDotToPattern(i);
                            }}
                          >
                            {isTapped ? orderIdx + 1 : '·'}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-[15px]">
                    <span className="font-bold text-ink">
                      Mantén el clic o arrastra tu dedo sobre los puntos.
                    </span>
                    <span className="text-muted">
                      Orden:{' '}
                      <strong className="text-ink font-mono font-bold">
                        {patronSequence.length
                          ? patronSequence.map((i) => i + 1).join(' → ')
                          : 'Desliza o haz clic en los puntos'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearPatron}
                      className="mt-1 h-9 px-3 border border-line bg-surface text-sm font-bold text-ink hover:border-accent self-start"
                    >
                      Borrar patrón
                    </button>
                  </div>
                </div>
              )}

              {tipoClave === 'pin' && (
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="PIN del equipo"
                    value={pinValue}
                    onChange={(e) => {
                      setPinValue(e.target.value.replace(/\D/g, ''));
                      if (errorMsg.includes('PIN')) setErrorMsg('');
                    }}
                    className="h-12 w-full max-w-[220px] border border-line bg-surface px-4 text-xl font-bold font-mono tracking-[0.3em] text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {tipoClave === 'contrasena' && (
                <div>
                  <input
                    type="text"
                    placeholder="Contraseña del equipo"
                    value={txtValue}
                    onChange={(e) => {
                      setTxtValue(e.target.value);
                      if (errorMsg.includes('contraseña')) setErrorMsg('');
                    }}
                    className="h-12 w-full border border-line bg-surface px-3 text-base font-mono text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {tipoClave === 'ninguno' && (
                <p className="text-sm text-muted">El equipo no tiene bloqueo.</p>
              )}

              <span className="flex items-center gap-1.5 text-xs text-muted pt-1">
                <Lock size={13} className="shrink-0" />
                <span>Se guarda cifrada y se borra al entregar.</span>
              </span>
            </div>
          </section>

          {/* 03 PRECIO Y CIERRE (D3: placed as step 03) */}
          <section ref={step3Ref} className="flex flex-col gap-3 border-t-2 border-line pt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-extrabold text-accent-ink">03</span>
              <h3 className="text-xl font-extrabold text-ink">Precio y cierre</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">
                Título · se genera solo, puedes editarlo
              </label>
              <input
                type="text"
                placeholder={selectedPhone?.name || modeloInput ? `Reparación ${selectedPhone?.name || modeloInput}` : 'Se genera al elegir equipo o pieza'}
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  setTituloTouched(true);
                }}
                className="h-11 border border-line bg-surface px-3 text-base font-bold text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">Precio total acordado</label>
                <div className="flex items-stretch border border-line bg-surface">
                  <span className="flex items-center px-3 font-bold text-ink bg-line/20 border-r border-line">
                    S/
                  </span>
                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="flex-1 min-w-0 h-11 border-0 bg-transparent px-3 text-lg font-extrabold font-mono text-ink outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">Técnico (opcional)</label>
                <select
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                >
                  <option value="">Sin asignar</option>
                  {activeTechnicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">Adelanto (opcional)</label>
                <div className="flex items-stretch border border-line bg-surface">
                  <span className="flex items-center px-3 font-bold text-ink bg-line/20 border-r border-line">
                    S/
                  </span>
                  <input
                    type="number"
                    value={adelanto}
                    onChange={(e) => setAdelanto(e.target.value)}
                    className="flex-1 min-w-0 h-11 border-0 bg-transparent px-3 text-base font-bold font-mono text-ink outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 border border-line mt-1.5">
                  {['efectivo', 'yape'].map((m, idx) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoPago(m)}
                      className={`h-9 text-xs font-bold uppercase tracking-wider transition-colors ${
                        idx > 0 ? 'border-l border-line' : ''
                      } ${
                        metodoPago === m
                          ? 'bg-ink text-bg'
                          : 'bg-transparent text-ink hover:bg-surface'
                      }`}
                    >
                      {m === 'efectivo' ? 'Efectivo' : 'Yape'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-1 p-3.5 bg-surface border border-line h-full">
                <span className="text-xs text-muted">Saldo por cobrar al entregar</span>
                <span className="text-[32px] font-extrabold leading-none tracking-tight font-mono text-ink">
                  {formatPEN(saldo)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">Nota para el cliente (opcional)</label>
              <textarea
                rows={2}
                placeholder="Se muestra en su link de seguimiento."
                value={notaCliente}
                onChange={(e) => setNotaCliente(e.target.value)}
                className="w-full border border-line bg-surface p-2.5 text-sm text-ink focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Solo Panel Strip */}
            <div className="flex items-center gap-3.5 flex-wrap p-3 border border-dashed border-line text-sm">
              <span className="px-2 py-0.5 bg-ink text-bg text-xs font-extrabold uppercase tracking-wider">
                Solo panel
              </span>
              <span>
                Costo de piezas <strong className="font-mono">{formatPEN(costoTotal)}</strong>
              </span>
              <span className="text-muted">·</span>
              <span>
                Ganancia{' '}
                <strong className={`font-mono ${ganancia < 0 ? 'text-danger-ink' : 'text-accent-ink'}`}>
                  {formatPEN(ganancia)}
                </strong>
              </span>
            </div>
          </section>

          {/* 04 PIEZAS (D3: placed as step 04) */}
          <section ref={step4Ref} className="flex flex-col gap-3 border-t-2 border-line pt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-extrabold text-accent-ink">04</span>
              <h3 className="text-xl font-extrabold text-ink">Piezas</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">Categoría</label>
                <input
                  type="text"
                  list="newticket-categories"
                  placeholder="Escribe categoría (ej. Pantallas)..."
                  value={categoriaQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategoriaQuery(val);
                    const match = categories.find((c) => c.name.toLowerCase() === val.trim().toLowerCase());
                    setCategoriaId(match ? match.id : '');
                  }}
                  className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
                <datalist id="newticket-categories">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">Buscar repuesto</label>
                <input
                  type="text"
                  placeholder="Filtro por texto o modelo..."
                  value={piezaQuery}
                  onChange={(e) => setPiezaQuery(e.target.value)}
                  className="h-11 border border-line bg-surface px-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Compatible Parts Results List */}
            <div className="flex flex-col border-t-2 border-ink">
              {loadingAvailability ? (
                <div className="py-4 text-sm text-muted">
                  Buscando repuestos en inventario...
                </div>
              ) : availabilityItems.length === 0 ? (
                <div className="py-4 text-sm text-muted italic">
                  No hay piezas registradas en inventario con estos filtros.
                </div>
              ) : (
                availabilityItems.map((r) => {
                  const isAdded = selectedPiezas.some((p) => p.productoId === r.productoId);
                  const isBlocked = r.disponible <= 0;
                  return (
                    <div
                      key={r.productoId}
                      className={`flex items-center gap-3 py-3 border-b border-line ${
                        isBlocked ? 'opacity-65' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="font-bold text-[15px] text-ink truncate">
                          {r.nombre}
                        </span>
                        <span className="text-xs text-muted">{availabilityMeta(r)}</span>
                      </div>
                      <span className="text-sm font-mono text-muted tabular-nums whitespace-nowrap">
                        Costo {formatPEN(r.costo || 0)}
                      </span>
                      {isBlocked ? (
                        <span className="flex items-center gap-1.5 h-9 px-3 border border-dashed border-line text-xs font-bold text-muted whitespace-nowrap">
                          <Lock size={12} />
                          {r.reservas?.[0] ? 'Reservada' : 'Sin stock'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddPiece(r)}
                          disabled={isAdded}
                          className={`h-9 px-3 text-xs font-bold whitespace-nowrap transition-colors ${
                            isAdded
                              ? 'border border-line bg-transparent text-muted'
                              : 'bg-accent text-on-accent hover:opacity-90'
                          }`}
                        >
                          {isAdded ? 'Agregada' : 'Agregar'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Piezas del ticket selected */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Piezas del ticket
              </span>
              {selectedPiezas.map((p) => (
                <div
                  key={p.productoId}
                  className="flex items-center gap-3 p-2.5 border border-ink bg-surface text-sm"
                >
                  <span className="font-bold text-ink flex-1 truncate">{p.nombre}</span>
                  <span className="px-2 py-0.5 border border-line text-[11px] font-bold uppercase tracking-wider text-muted">
                    Planificada
                  </span>
                  <div className="flex items-center border border-line bg-bg">
                    <button
                      type="button"
                      onClick={() => handleDecPiece(p.productoId)}
                      className="flex h-7 w-7 items-center justify-center font-bold text-ink hover:bg-line/40"
                    >
                      −
                    </button>
                    <span className="flex h-7 w-8 items-center justify-center border-l border-r border-line font-bold font-mono text-ink">
                      {p.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncPiece(p.productoId)}
                      disabled={p.cantidad >= p.disponible}
                      className="flex h-7 w-7 items-center justify-center font-bold text-ink hover:bg-line/40 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePiece(p.productoId)}
                    className="flex h-7 w-7 items-center justify-center text-muted hover:text-danger-ink"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              {selectedPiezas.length === 0 && (
                <span className="text-sm text-muted italic">
                  Sin piezas. Agrégalas desde la lista de arriba si se cambiarán repuestos.
                </span>
              )}
              <span className="text-xs text-muted">
                Se descuentan del stock al aprobar el ticket.
              </span>
            </div>
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="flex shrink-0 flex-col gap-3 px-4 sm:px-7 py-4 border-t-2 border-ink bg-bg sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-muted">Total {formatPEN(numPrecio)}</span>
            <span className="text-[17px] font-extrabold text-ink">Saldo {formatPEN(saldo)}</span>
          </div>

          <div className="flex gap-3 sm:ml-auto">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="h-12 flex-1 sm:flex-none px-5 border border-line bg-surface text-[15px] font-bold text-ink hover:border-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateTicket}
              disabled={isSubmitting}
              className="h-12 flex-1 sm:flex-none px-6 bg-accent text-on-accent text-base font-extrabold tracking-wide hover:opacity-95 transition-opacity"
            >
              {isSubmitting ? 'Creando…' : 'Crear ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
    <DiscardChangesDialog open={confirmOpen} onCancel={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
