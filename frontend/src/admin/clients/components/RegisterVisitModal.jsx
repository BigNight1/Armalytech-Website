import { useState, useEffect } from 'react';
import { Button, Input, Modal, Spinner } from '../../shared/ui/index.js';
import LoyaltyStamps from './LoyaltyStamps.jsx';
import { clientsApi } from '../api/clientsApi.js';
import { formatPhone } from '../lib/format.js';

export default function RegisterVisitModal({
  open,
  onClose,
  initialClient = null,
  onVisitRegistered,
}) {
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundClient, setFoundClient] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultNotice, setResultNotice] = useState(null);

  useEffect(() => {
    if (open) {
      if (initialClient) {
        setFoundClient(initialClient);
        setPhone(initialClient.phoneE164 || '');
      } else {
        setFoundClient(null);
        setPhone('');
      }
      setSearchError('');
      setResultNotice(null);
    }
  }, [open, initialClient]);

  async function handleSearch(e) {
    if (e) e.preventDefault();
    const clean = phone.trim();
    if (!clean) return;

    setIsSearching(true);
    setSearchError('');
    setResultNotice(null);

    try {
      const res = await clientsApi.listClients({ q: clean, limit: 1 });
      const item = res.items?.[0];
      if (item) {
        setFoundClient(item);
      } else {
        setFoundClient(null);
        setSearchError('No se encontró ningún cliente con ese número o nombre.');
      }
    } catch {
      setSearchError('Error al buscar cliente en el servidor.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleConfirmVisit() {
    if (!foundClient) return;
    setIsSubmitting(true);
    setSearchError('');

    try {
      const res = await clientsApi.registerClientVisit(foundClient.id);
      const updated = res.client;
      setFoundClient(updated);

      if (res.thresholdReached) {
        setResultNotice({
          type: 'threshold',
          message: '¡Sello 4 alcanzado! Se ha emitido notificación por WhatsApp / n8n con el descuento del 20% para la próxima visita.',
        });
      } else if (res.rewardReady) {
        setResultNotice({
          type: 'reward',
          message: '¡5 Sellos completados! El cliente ha desbloqueado su 20% de descuento para aplicar en esta reparación.',
        });
      } else {
        setResultNotice({
          type: 'success',
          message: `Visita registrada con éxito. Ahora tiene ${updated.stamps} de 5 sellos.`,
        });
      }

      if (onVisitRegistered) {
        onVisitRegistered(updated);
      }
    } catch (err) {
      setSearchError(err?.message || 'Error al registrar visita');
    } finally {
      setIsSubmitting(false);
    }
  }

  const nextStamps = foundClient ? Math.min(5, (foundClient.stamps ?? 0) + 1) : 1;

  return (
    <Modal open={open} title="Registrar Visita de Cliente" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {!initialClient && (
          <form onSubmit={handleSearch} className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Buscar cliente por teléfono o nombre"
                placeholder="Ej. 965728013 o Edu..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isSearching || !phone.trim()}>
              {isSearching ? <Spinner size="sm" /> : 'Buscar'}
            </Button>
          </form>
        )}

        {searchError && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
            {searchError}
          </p>
        )}

        {foundClient && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-brand-ink">
                  {foundClient.firstName} {foundClient.lastName}
                </h4>
                <p className="text-xs text-slate-400">
                  {formatPhone(foundClient.phoneE164)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Total histórico</span>
                <p className="text-sm font-bold text-brand-ink">
                  {foundClient.visitCount ?? 0} visitas
                </p>
              </div>
            </div>

            <LoyaltyStamps stamps={foundClient.stamps ?? 0} size="md" />

            {resultNotice ? (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  resultNotice.type === 'reward'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 font-medium'
                    : resultNotice.type === 'threshold'
                    ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {resultNotice.message}
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Al confirmar pasará a:{' '}
                  <strong className="text-brand-orange">{nextStamps} / 5 sellos</strong>
                </span>
                <Button
                  onClick={handleConfirmVisit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" /> Guardando…
                    </span>
                  ) : (
                    'Confirmar Visita (+1)'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            {resultNotice ? 'Cerrar' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
