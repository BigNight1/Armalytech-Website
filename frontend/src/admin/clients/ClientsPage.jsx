import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useClients } from './hooks/useClients.js';
import { useClientEvents } from './hooks/useClientEvents.js';
import { useCommunityEvents } from './hooks/useCommunityEvents.js';
import { useClientStats } from './hooks/useClientStats.js';
import ClientsTable from './components/ClientsTable.jsx';
import ClientsEmptyState from './components/ClientsEmptyState.jsx';
import ClientDetailModal from './components/ClientDetailModal.jsx';
import RegisterVisitModal from './components/RegisterVisitModal.jsx';
import ActivityTab from './components/ActivityTab.jsx';
import StatCards from './components/StatCards.jsx';
import { Button, Select, SkeletonTable, useToast } from '../shared/ui/index.js';
import { useDelayedFlag } from '../shared/lib/useDelayedFlag.js';
import { useBreadcrumb } from '../shared/layout/breadcrumb.jsx';
import { clientsApi } from './api/clientsApi.js';
import { clientsKeys } from './api/queryKeys.js';

const CONSENT_OPTIONS = [
  { value: 'all', label: 'Promociones: Todos' },
  { value: 'approved', label: 'Aprobó' },
  { value: 'declined', label: 'Descartó' },
];

const TABS = [
  { key: 'clientes', label: 'Clientes y sellos' },
  { key: 'actividad', label: 'Actividad' },
];

/** Container for the Clientes section: client list/search + loyalty & "Actividad" tab. */
export default function ClientsPage() {
  const [tab, setTab] = useState('clientes'); // 'clientes' | 'actividad'
  const [selectedClient, setSelectedClient] = useState(null);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  useBreadcrumb(tab === 'actividad' ? 'Actividad' : null);

  const { notify } = useToast();
  const queryClient = useQueryClient();

  const clientsState = useClients();
  const clientEvents = useClientEvents(selectedClient?.id);
  const communityEvents = useCommunityEvents();
  const stats = useClientStats();

  const hasClients = clientsState.items.length > 0;
  const showClientsLoading = useDelayedFlag(clientsState.isLoading);
  const showActivityLoading = useDelayedFlag(communityEvents.isLoading);
  const totalPages = Math.max(1, Math.ceil(clientsState.total / clientsState.pageSize));

  // One-click "+1 visita" from the table row (design: `c.addVisit`). Guarded
  // against double clicks via `isPending` + `variables` (disables just the
  // row that's in flight, not the whole table).
  const quickVisitMutation = useMutation({
    mutationFn: (clientId) => clientsApi.registerClientVisit(clientId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
      if (res.thresholdReached) {
        notify('¡Sello 4 alcanzado! Se envió recordatorio por WhatsApp para la promo del 20%.', { type: 'success' });
      } else if (res.rewardReady) {
        notify('¡5 sellos acumulados! El 20% de descuento está listo para canjear.', { type: 'success' });
      } else {
        notify(`Visita registrada. Sellos actuales: ${res.client.stamps}/5.`, { type: 'success' });
      }
      if (selectedClient?.id === res.client.id) {
        setSelectedClient(res.client);
        clientEvents.refetch();
      }
    },
    onError: (err) => notify(err.message ?? 'No se pudo registrar la visita', { type: 'error' }),
  });

  async function handleSaveClient(id, changes) {
    const updated = await clientsState.updateClient(id, changes);
    setSelectedClient(updated);
    stats.refetch();
    return updated;
  }

  function handleClientUpdated(updated) {
    setSelectedClient(updated);
    clientsState.refetch();
    stats.refetch();
    clientEvents.refetch();
  }

  function handleVisitRegistered() {
    clientsState.refetch();
    stats.refetch();
    if (selectedClient) {
      clientEvents.refetch();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">Fidelización</span>
          <h1>Clientes</h1>
        </div>
        <Button onClick={() => setIsVisitModalOpen(true)}>
          <Plus size={18} strokeWidth={2.2} />
          <span>Registrar visita</span>
        </Button>
      </div>

      <StatCards
        totalClients={stats.totalClients}
        visitsToday={stats.visitsToday}
        approvedConsent={stats.approvedConsent}
      />

      <div className="flex flex-wrap items-center gap-7 border-b-2 border-line">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`-mb-0.5 border-b-[3px] py-2.5 text-[15px] transition-colors ${
              tab === item.key ? 'border-accent font-bold text-ink' : 'border-transparent font-semibold text-muted hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}

        {tab === 'clientes' && (
          <div className="ml-auto flex flex-wrap gap-3 pb-2.5">
            <div className="relative w-full sm:w-[300px]">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                name="clients-search"
                placeholder="Nombre, apellido o número..."
                value={clientsState.query}
                onChange={(e) => clientsState.setQuery(e.target.value)}
                className="min-h-[40px] w-full border border-line bg-surface py-2 pl-9 pr-3 text-[15px] text-ink placeholder:text-muted focus:outline-none focus-visible:border-accent"
              />
            </div>
            <Select
              options={CONSENT_OPTIONS}
              value={clientsState.consent}
              onChange={(e) => clientsState.setConsent(e.target.value)}
              className="w-full sm:w-[230px]"
            />
          </div>
        )}
      </div>

      {tab === 'clientes' ? (
        <div className="flex flex-col gap-4">
          {showClientsLoading ? (
            <SkeletonTable rows={6} columns={8} />
          ) : hasClients ? (
            <>
              <ClientsTable
                clients={clientsState.items}
                onSelectClient={setSelectedClient}
                onQuickVisit={(client) => quickVisitMutation.mutate(client.id)}
                pendingVisitId={quickVisitMutation.isPending ? quickVisitMutation.variables : null}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 text-sm text-muted">
                  <button
                    type="button"
                    disabled={clientsState.page <= 1}
                    onClick={() => clientsState.setPage(clientsState.page - 1)}
                    className="border border-line px-3 py-1 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span>
                    Página {clientsState.page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={clientsState.page >= totalPages}
                    onClick={() => clientsState.setPage(clientsState.page + 1)}
                    className="border border-line px-3 py-1 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            <ClientsEmptyState />
          )}
        </div>
      ) : (
        <ActivityTab
          events={communityEvents.events}
          isLoading={showActivityLoading}
          range={communityEvents.range}
          onRangeChange={communityEvents.setRange}
          type={communityEvents.type}
          onTypeChange={communityEvents.setType}
        />
      )}

      <ClientDetailModal
        client={selectedClient}
        events={clientEvents.events}
        isLoadingEvents={clientEvents.isLoading}
        onSave={handleSaveClient}
        onClientUpdated={handleClientUpdated}
        onClose={() => setSelectedClient(null)}
      />

      <RegisterVisitModal
        open={isVisitModalOpen}
        onVisitRegistered={handleVisitRegistered}
        onClose={() => setIsVisitModalOpen(false)}
      />
    </div>
  );
}
