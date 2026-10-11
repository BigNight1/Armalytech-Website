import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserPlus } from 'lucide-react';
import { useTechnicians } from './hooks/useTechnicians.js';
import { Button, Input, SkeletonTable, Tag, EmptyState } from '../shared/ui/index.js';

function initialsOf(nombre) {
  return (nombre || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '--';
}

/**
 * `/admin/tecnicos` — owner-only "Técnicos" section (ADR 0025 §10): plain
 * name catalog for the ticket form's "Técnico" select, not panel users.
 * Nav entry is gated in `Sidebar.jsx` (same pattern as `/admin/personal`);
 * this page renders for whoever reaches the route.
 */
export default function TechniciansPage() {
  const {
    technicians,
    isLoading,
    createTechnician,
    isCreating,
    setTechnicianActive,
  } = useTechnicians();

  const [nombre, setNombre] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  async function handleAdd() {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    try {
      await createTechnician(trimmed);
      setNombre('');
    } catch {
      // useTechnicians() already shows the error toast.
    }
  }

  async function handleToggle(t) {
    setTogglingId(t.id);
    try {
      await setTechnicianActive(t.id, t.activo === false);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>Técnicos · Panel Armalytech</title>
      </Helmet>
      <div className="flex flex-col gap-1.5 max-w-[680px]">
        <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">
          Administración
        </span>
        <h1>Técnicos</h1>
        <p className="text-[15px] text-muted">
          Nombres para asignar en los tickets. Los técnicos no entran al panel.
        </p>
      </div>

      <div className="flex max-w-[560px] items-end gap-2">
        <div className="flex-1">
          <Input
            size="lg"
            placeholder="Nombre y apellido del técnico"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} disabled={isCreating || !nombre.trim()}>
          <UserPlus size={16} />
          <span>Agregar técnico</span>
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} columns={4} />
      ) : technicians.length === 0 ? (
        <EmptyState
          title="Aún no hay técnicos"
          description="Agrega el primer técnico para poder asignarlo a los tickets."
        />
      ) : (
        <div className="overflow-x-auto border-t-2 border-ink max-w-[900px]">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Técnico</th>
                <th>Estado</th>
                <th>Tickets en curso</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((t) => {
                const active = t.activo !== false;
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center border border-line bg-surface text-sm font-extrabold text-ink">
                          {initialsOf(t.nombre)}
                        </span>
                        <span className="font-bold text-ink">{t.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <Tag variant={active ? 'accent' : 'neutral'}>
                        {active ? 'Activo' : 'Inactivo'}
                      </Tag>
                    </td>
                    <td className="tabular-nums">{t.ticketsEnCurso ?? 0}</td>
                    <td className="text-right">
                      <Button
                        variant="secondary"
                        onClick={() => handleToggle(t)}
                        disabled={togglingId === t.id}
                      >
                        {active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[15px] text-muted max-w-[760px]">
        Un técnico desactivado deja de aparecer al crear tickets. Sus tickets en curso siguen
        asignados hasta que los cambies.
      </p>
    </div>
  );
}
