import { DateRangePicker, EmptyState, Select, SkeletonTable } from '../../shared/ui/index.js';
import { todayInLima } from '../../shared/lib/time.js';
import { EVENT_TYPE_LABELS, REJECT_REASON_LABELS, formatLimaShort } from '../lib/format.js';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'registro', label: 'Registro' },
  { value: 'visita', label: 'Visita' },
  { value: 'registro_rechazado', label: 'Rechazado' },
];

/** Cross-client community event log: date range + type filter. */
export default function ActivityTab({ events, isLoading, range, onRangeChange, type, onTypeChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker label="Rango de fechas" value={range} onChange={onRangeChange} maxDate={todayInLima()} />
        <Select
          label="Tipo"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : events.length === 0 ? (
        <EmptyState
          title="Sin actividad en este rango"
          description="Los registros, visitas y registros rechazados de la comunidad aparecerán aquí a medida que ocurran. Prueba ampliar el rango de fechas."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="min-w-full divide-y divide-slate-700 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Teléfono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {events.map((event) => (
                <tr key={event.id} className="text-brand-ink">
                  <td className="px-4 py-3 whitespace-nowrap">{formatLimaShort(event.occurredAt)}</td>
                  <td className="px-4 py-3">{EVENT_TYPE_LABELS[event.type] ?? event.type}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {event.rejectReason ? REJECT_REASON_LABELS[event.rejectReason] ?? event.rejectReason : '—'}
                  </td>
                  <td className="px-4 py-3 uppercase text-slate-400">{event.channel}</td>
                  <td className="px-4 py-3 text-slate-400">{event.phoneE164}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
