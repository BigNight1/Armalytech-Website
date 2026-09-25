import { DateRangePicker, EmptyState, Select, SkeletonTable } from '../../shared/ui/index.js';
import { todayInLima } from '../../shared/lib/time.js';
import { EVENT_TYPE_LABELS, REJECT_REASON_LABELS, formatLimaShort, formatPhone } from '../lib/format.js';

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
        <Select label="Tipo" options={TYPE_OPTIONS} value={type} onChange={(e) => onTypeChange(e.target.value)} />
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : events.length === 0 ? (
        <EmptyState
          title="Sin actividad en este rango"
          description="Los registros, visitas y registros rechazados de la comunidad aparecerán aquí a medida que ocurran. Prueba ampliar el rango de fechas."
        />
      ) : (
        <div className="overflow-x-auto border-t-2 border-ink">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Canal</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap text-muted">{formatLimaShort(event.occurredAt)}</td>
                  <td className="font-semibold text-ink">{EVENT_TYPE_LABELS[event.type] ?? event.type}</td>
                  <td className="text-muted">
                    {event.rejectReason ? REJECT_REASON_LABELS[event.rejectReason] ?? event.rejectReason : '—'}
                  </td>
                  <td className="text-sm uppercase text-muted">{event.channel}</td>
                  <td className="whitespace-nowrap tabular-nums text-muted">
                    {formatPhone(event.phoneE164)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
