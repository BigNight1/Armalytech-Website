import { useState } from 'react';
import { useClients } from './hooks/useClients.js';
import { useClientEvents } from './hooks/useClientEvents.js';
import { useCommunityEvents } from './hooks/useCommunityEvents.js';
import { useClientStats } from './hooks/useClientStats.js';
import ClientsTable from './components/ClientsTable.jsx';
import ClientsEmptyState from './components/ClientsEmptyState.jsx';
import ClientDetailModal from './components/ClientDetailModal.jsx';
import ActivityTab from './components/ActivityTab.jsx';
import StatCards from './components/StatCards.jsx';
import { Input, Select, SkeletonTable } from '../shared/ui/index.js';
import { useDelayedFlag } from '../shared/lib/useDelayedFlag.js';

const CONSENT_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'approved', label: 'Aprobó' },
  { value: 'declined', label: 'Descartó' },
];

/** Container for the Clientes section: client list/search + "Actividad" tab. */
export default function ClientsPage() {
  const [tab, setTab] = useState('clientes'); // 'clientes' | 'actividad'
  const [selectedClient, setSelectedClient] = useState(null);

  const clientsState = useClients();
  const clientEvents = useClientEvents(selectedClient?.id);
  const communityEvents = useCommunityEvents();
  const stats = useClientStats();

  const hasClients = clientsState.items.length > 0;
  const showClientsLoading = useDelayedFlag(clientsState.isLoading);
  const showActivityLoading = useDelayedFlag(communityEvents.isLoading);
  const totalPages = Math.max(1, Math.ceil(clientsState.total / clientsState.pageSize));

  async function handleSaveClient(id, changes) {
    const updated = await clientsState.updateClient(id, changes);
    setSelectedClient(updated);
    stats.refetch();
    return updated;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-ink">Clientes</h1>
      </div>

      <StatCards
        totalClients={stats.totalClients}
        visitsToday={stats.visitsToday}
        approvedConsent={stats.approvedConsent}
      />

      <div className="flex gap-2 border-b border-slate-700">
        {[
          { key: 'clientes', label: 'Clientes' },
          { key: 'actividad', label: 'Actividad' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === item.key
                ? 'border-brand-orange text-brand-ink'
                : 'border-transparent text-slate-400 hover:text-brand-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'clientes' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs">
              <Input
                name="clients-search"
                label="Buscar"
                placeholder="Nombre, apellido o número..."
                value={clientsState.query}
                onChange={(e) => clientsState.setQuery(e.target.value)}
              />
            </div>
            <Select
              label="Acepta promociones"
              options={CONSENT_OPTIONS}
              value={clientsState.consent}
              onChange={(e) => clientsState.setConsent(e.target.value)}
            />
          </div>

          {showClientsLoading ? (
            <SkeletonTable rows={6} columns={4} />
          ) : hasClients ? (
            <>
              <ClientsTable clients={clientsState.items} onSelectClient={setSelectedClient} />
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
                  <button
                    type="button"
                    disabled={clientsState.page <= 1}
                    onClick={() => clientsState.setPage(clientsState.page - 1)}
                    className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40"
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
                    className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40"
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
        onClose={() => setSelectedClient(null)}
      />
    </div>
  );
}
