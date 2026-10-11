 import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plus, Search } from 'lucide-react';
import { useTickets } from './hooks/useTickets.js';
import TicketsTable from './components/TicketsTable.jsx';
import NewTicketDrawer from './components/NewTicketDrawer.jsx';
import TicketDetailDrawer from './components/TicketDetailDrawer.jsx';
import { ticketsApi } from './api/ticketsApi.js';
import { Button, EmptyState, SkeletonTable, useToast } from '../shared/ui/index.js';

const TABS = [
  { id: '', label: 'Todos' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'aprobado', label: 'Aprobados' },
  { id: 'trabajando', label: 'En taller' },
  { id: 'listo', label: 'Listos' },
  { id: 'entregado', label: 'Entregados' },
  { id: 'cancelado', label: 'Cancelados' },
  { id: 'abandonado', label: 'Abandonados' },
];

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  trabajando: 'En taller',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  abandonado: 'Abandonado',
};

export default function TicketsPage() {
  const {
    items,
    total,
    totalPages,
    page,
    setPage,
    searchInput,
    setSearchInput,
    estadoFilter,
    setEstadoFilter,
    isLoading,
    refetch,
    createTicket,
    updateEstado,
    updateTicket,
  } = useTickets();

  const { notify } = useToast();
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketParam = searchParams.get('ticket');

  // Deep link from other sections (e.g. the client drawer's service history):
  // /admin/tickets?ticket=<id> opens that ticket's detail drawer.
  useEffect(() => {
    if (!ticketParam) return undefined;
    let cancelled = false;
    ticketsApi
      .getTicket(ticketParam)
      .then((ticket) => {
        if (!cancelled) setSelectedTicket(ticket);
      })
      .catch(() => {
        if (!cancelled) notify('No se encontró el ticket.', { type: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [ticketParam, notify]);

  function closeDetail() {
    setSelectedTicket(null);
    if (ticketParam) {
      const next = new URLSearchParams(searchParams);
      next.delete('ticket');
      setSearchParams(next, { replace: true });
    }
  }

  async function handleCreateTicket(payload) {
    try {
      const res = await createTicket(payload);
      notify(`Ticket creado: ${res.codigo}`, { type: 'success' });
      refetch();
    } catch (err) {
      notify(err?.message || 'Verifica los campos obligatorios.', { type: 'error' });
      throw err;
    }
  }

  async function handleStatusChange(ticketId, payload) {
    try {
      const updated = await updateEstado({ id: ticketId, payload });
      const label = ESTADO_LABELS[updated.estado] || updated.estado;
      notify(`El ticket ${updated.codigo} ahora está en: ${label}`, { type: 'success' });
      setSelectedTicket(updated);
      refetch();
      return updated;
    } catch (err) {
      if (err?.code === 'insufficient_stock') {
        // TicketDetailDrawer shows its own "no se pudo aprobar" dialog
        // with the `faltantes` breakdown — no generic toast here.
        throw err;
      }
      if (err?.code === 'ticket_modified') {
        notify('El ticket cambió, recargando', { type: 'info' });
        try {
          const fresh = await ticketsApi.getTicket(ticketId);
          setSelectedTicket(fresh);
        } catch {
          // Ignore — refetch() below still refreshes the list.
        }
        refetch();
        throw err;
      }
      notify(err?.message || 'Transición no permitida.', { type: 'error' });
      throw err;
    }
  }

  async function handleUpdateTicket(ticketId, changes) {
    try {
      // No changes means "the ticket changed elsewhere (e.g. a note was
      // added via POST /notas), reload it" — don't send an empty PATCH.
      const updated = changes
        ? await updateTicket({ id: ticketId, changes })
        : await ticketsApi.getTicket(ticketId);
      notify('Se guardaron los cambios del taller.', { type: 'success' });
      setSelectedTicket(updated);
      refetch();
    } catch (err) {
      notify(err?.message || 'No se pudieron guardar las notas.', { type: 'error' });
      throw err;
    }
  }

  const inShopCount = items.filter(
    (t) => t.estado === 'aprobado' || t.estado === 'trabajando'
  ).length;
  const readyCount = items.filter((t) => t.estado === 'listo').length;

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>Tickets · Panel Armalytech</title>
      </Helmet>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">
            Operación
          </span>
          <h1>Tickets</h1>
        </div>
        <Button onClick={() => setNewDrawerOpen(true)}>
          <Plus size={18} strokeWidth={2.2} />
          <span>Nuevo ticket</span>
        </Button>
      </div>

      {/* Modernist Stat Cards Strip (Claude Design) */}
      <div className="grid grid-cols-1 border-t-2 border-ink sm:grid-cols-3">
        <div className="flex flex-col gap-1 py-3.5 pr-5">
          <span className="text-[40px] font-extrabold leading-none tracking-tight text-ink">
            {total}
          </span>
          <span className="text-[15px] text-muted">Total tickets</span>
        </div>
        <div className="flex flex-col gap-1 py-3.5 pr-5 border-t-2 border-line sm:border-l-2 sm:border-t-0 sm:pl-5">
          <span className="text-[40px] font-extrabold leading-none tracking-tight text-accent-ink">
            {inShopCount}
          </span>
          <span className="text-[15px] text-muted">En taller / reparación</span>
        </div>
        <div className="flex flex-col gap-1 py-3.5 pr-5 border-t-2 border-line sm:border-l-2 sm:border-t-0 sm:pl-5">
          <span className="text-[40px] font-extrabold leading-none tracking-tight text-ink">
            {readyCount}
          </span>
          <span className="text-[15px] text-muted">Listos para entrega</span>
        </div>
      </div>

      {/* Tabs bar with integrated search input on right */}
      <div className="flex flex-wrap items-center gap-7 border-b-2 border-line">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setEstadoFilter(item.id)}
            className={`-mb-0.5 border-b-[3px] py-2.5 text-[15px] transition-colors ${
              estadoFilter === item.id
                ? 'border-accent font-bold text-ink'
                : 'border-transparent font-semibold text-muted hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}

        <div className="ml-auto flex flex-wrap gap-3 pb-2.5">
          <div className="relative w-full sm:w-[320px]">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="tickets-search"
              placeholder="Buscar por código, cliente, celular..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-h-[40px] w-full border border-line bg-surface py-2 pl-9 pr-3 text-[15px] text-ink placeholder:text-muted focus:outline-none focus-visible:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Main Table / Empty State */}
      {isLoading ? (
        <SkeletonTable rows={6} columns={7} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aún no hay tickets de servicio"
          description={
            searchInput || estadoFilter
              ? 'No hay tickets que coincidan con la búsqueda o filtro seleccionado.'
              : 'Los tickets registrados aparecerán aquí para realizar seguimiento técnico y cobros.'
          }
          action={
            <Button onClick={() => setNewDrawerOpen(true)}>
              <Plus size={16} />
              <span>Crear nuevo ticket</span>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <TicketsTable tickets={items} onSelectTicket={(t) => setSelectedTicket(t)} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm text-muted pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="border border-line px-3 py-1 disabled:opacity-40 hover:border-ink transition-colors"
              >
                Anterior
              </button>
              <span>
                Página {page} de {totalPages} ({total} tickets)
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="border border-line px-3 py-1 disabled:opacity-40 hover:border-ink transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Ticket Drawer */}
      <NewTicketDrawer
        open={newDrawerOpen}
        onClose={() => setNewDrawerOpen(false)}
        onSubmit={handleCreateTicket}
      />

      {/* Ticket Detail Drawer */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        open={Boolean(selectedTicket)}
        onClose={closeDetail}
        onStatusChange={handleStatusChange}
        onUpdateTicket={handleUpdateTicket}
      />
    </div>
  );
}
