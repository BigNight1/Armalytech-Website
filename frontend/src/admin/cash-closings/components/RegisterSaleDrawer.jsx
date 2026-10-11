import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { inventoryApi } from '../../inventory/api/inventoryApi.js';
import { httpClient } from '../../shared/api/httpClient.js';
import { formatPEN } from '../../shared/lib/money.js';
import { useToast, useUnsavedGuard, DiscardChangesDialog } from '../../shared/ui/index.js';

export default function RegisterSaleDrawer({ open, onClose, onSuccess }) {
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [cart, setCart] = useState([]);
  const [metodo, setMetodo] = useState('efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const searchTimer = useRef(null);

  // Reset on open/close
  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSearchResults([]);
    setCart([]);
    setMetodo('efectivo');
    setErrorMsg('');
    setIsSubmitting(false);
  }, [open]);

  // Debounced product search
  useEffect(() => {
    if (!open) return;
    const query = search.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    clearTimeout(searchTimer.current);
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await inventoryApi.listProducts({ q: query, limit: 12 });
        const items = res?.items ?? [];
        setSearchResults(items);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(searchTimer.current);
  }, [search, open]);

  function handleAddToCart(product) {
    setErrorMsg('');
    setCart((prev) => {
      const existing = prev.find((item) => item.productoId === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock) {
          notify(`Stock máximo alcanzado (${product.stock}) para ${product.name}`, { type: 'warning' });
          return prev;
        }
        return prev.map((item) =>
          item.productoId === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productoId: product.id,
          nombre: product.name,
          stock: product.stock,
          cantidad: 1,
          precioUnitario: Number(product.salePrice ?? product.price ?? 0),
        },
      ];
    });
  }

  function handleUpdateQty(productoId, delta) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productoId !== productoId) return item;
          const next = item.cantidad + delta;
          if (next <= 0) return null;
          if (next > item.stock) {
            notify(`Stock máximo disponible: ${item.stock}`, { type: 'warning' });
            return item;
          }
          return { ...item, cantidad: next };
        })
        .filter(Boolean),
    );
  }

  function handleUpdatePrice(productoId, val) {
    const num = Number(val);
    setCart((prev) =>
      prev.map((item) =>
        item.productoId === productoId
          ? { ...item, precioUnitario: isNaN(num) || num < 0 ? 0 : num }
          : item,
      ),
    );
  }

  function handleRemoveItem(productoId) {
    setCart((prev) => prev.filter((item) => item.productoId !== productoId));
  }

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0),
    [cart],
  );

  // Unsaved-changes guard: a non-empty cart or an unsearched query is typed
  // input the accidental backdrop click/✕/Esc/Cancelar must not discard
  // silently (odd/tasks/unsaved-changes-guard.md).
  const isDirty = cart.length > 0 || search.trim() !== '';
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

  async function handleRegisterSale() {
    if (cart.length === 0) {
      setErrorMsg('Agrega al menos un producto a la venta.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        metodo,
        items: cart.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
      };

      const res = await httpClient.post('/sales', payload);
      notify(`Venta ${res?.sale?.codigo ?? ''} registrada con éxito`, { type: 'success' });
      if (onSuccess) onSuccess(res?.sale);
      onClose();
    } catch (err) {
      const msg = err?.details?.message || err?.message || 'Error al registrar la venta.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

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
        className="flex h-full w-full max-w-[560px] flex-col border-l-4 border-accent bg-bg text-ink shadow-admin-lg"
      >
        {/* Header */}
        <div className="flex h-20 shrink-0 items-center justify-between gap-4 px-4 sm:px-7 border-b border-line">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">
              Historial · Venta rápida
            </span>
            <h2 className="text-[26px] font-extrabold leading-none text-ink">
              Registrar venta
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

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 sm:px-7 py-5">
          {errorMsg && (
            <div className="flex items-center gap-2 border border-danger bg-danger-bg p-3 text-sm text-danger-ink">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Box */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Buscar producto en inventario
            </label>
            <div className="flex items-center border border-line bg-surface px-3">
              <Search size={16} className="text-muted mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Nombre, marca, modelo o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="h-11 w-full border-0 bg-transparent text-[15px] text-ink outline-none"
              />
              {isSearching && (
                <span className="text-xs font-bold text-muted ml-2 shrink-0">Buscando...</span>
              )}
            </div>

            {/* Search results dropdown/list */}
            {searchResults.length > 0 && (
              <div className="flex flex-col border border-line bg-surface max-h-[200px] overflow-y-auto divide-y divide-line shadow-sm">
                {searchResults.map((p) => {
                  const noStock = p.stock <= 0;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between gap-3 p-3 transition-colors ${
                        noStock ? 'opacity-50' : 'hover:bg-line/20'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[15px] text-ink truncate">{p.name}</span>
                        <span className="text-xs text-muted">
                          {p.category?.name || 'Producto'} · Stock: {p.stock}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-ink">
                          {formatPEN(p.salePrice ?? p.price ?? 0)}
                        </span>
                        <button
                          type="button"
                          disabled={noStock}
                          onClick={() => handleAddToCart(p)}
                          className="h-8 px-2.5 bg-accent text-on-accent text-xs font-bold flex items-center gap-1 hover:opacity-90 disabled:opacity-40"
                        >
                          <Plus size={14} />
                          <span>Agregar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="flex flex-col gap-3 flex-1 border-t-2 border-line pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <ShoppingBag size={14} />
                Productos para la venta ({cart.length})
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs font-bold text-muted hover:text-danger-ink"
                >
                  Vaciar lista
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-line text-center">
                <ShoppingBag size={28} className="text-muted mb-2 opacity-50" />
                <p className="text-sm font-semibold text-muted">Aún no agregaste productos</p>
                <p className="text-xs text-muted mt-1">
                  Usa el buscador para seleccionar accesorios o repuestos
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-line border border-line bg-surface">
                {cart.map((item) => (
                  <div key={item.productoId} className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 sm:p-3">
                    <div className="flex flex-col flex-1 min-w-0 basis-full sm:basis-auto">
                      <span className="font-bold text-[15px] text-ink truncate">{item.nombre}</span>
                      <span className="text-xs text-muted">Stock máx: {item.stock}</span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center border border-line bg-bg shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productoId, -1)}
                        className="flex h-7 w-7 items-center justify-center font-bold text-ink hover:bg-line/40"
                      >
                        −
                      </button>
                      <span className="flex h-7 w-8 items-center justify-center border-l border-r border-line font-bold font-mono text-ink text-sm">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productoId, 1)}
                        disabled={item.cantidad >= item.stock}
                        className="flex h-7 w-7 items-center justify-center font-bold text-ink hover:bg-line/40 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    {/* Unit Price input */}
                    <div className="flex items-center border border-line bg-bg px-2 h-8 w-20 sm:w-24 shrink-0">
                      <span className="text-xs text-muted mr-1">S/</span>
                      <input
                        type="number"
                        step="0.5"
                        value={item.precioUnitario}
                        onChange={(e) => handleUpdatePrice(item.productoId, e.target.value)}
                        className="w-full font-mono text-sm font-bold text-ink bg-transparent outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.productoId)}
                      className="flex h-8 w-8 items-center justify-center text-muted hover:text-danger-ink shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Method */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Método de pago
              </label>
              <div className="grid grid-cols-2 border border-line">
                {['efectivo', 'yape'].map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetodo(m)}
                    className={`h-11 text-sm font-bold uppercase tracking-wider transition-colors ${
                      idx > 0 ? 'border-l border-line' : ''
                    } ${
                      metodo === m
                        ? 'bg-ink text-bg'
                        : 'bg-transparent text-ink hover:bg-surface'
                    }`}
                  >
                    {m === 'efectivo' ? 'Efectivo' : 'Yape'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap shrink-0 items-center justify-between gap-4 px-4 sm:px-7 py-4 border-t-2 border-ink bg-bg">
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-muted">Total a cobrar</span>
            <span className="text-xl sm:text-[26px] font-extrabold font-mono text-ink">
              {formatPEN(total)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="h-12 px-5 border border-line bg-surface text-[15px] font-bold text-ink hover:border-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRegisterSale}
              disabled={isSubmitting || cart.length === 0}
              className="h-12 px-6 bg-accent text-on-accent text-base font-extrabold tracking-wide hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando…' : 'Completar venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
    <DiscardChangesDialog open={confirmOpen} onCancel={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
