import { Spinner } from '../../shared/ui/index.js';
import ConsentBadge from './ConsentBadge.jsx';
import LoyaltyStamps from './LoyaltyStamps.jsx';
import { formatPhone, formatLimaShort } from '../lib/format.js';

const CHANNEL_LABELS = { qr: 'QR', nfc: 'NFC', manual: 'Manual' };

/** Clientes table with loyalty stamps and a one-click "+1 visita" action. */
export default function ClientsTable({ clients, onSelectClient, onQuickVisit, pendingVisitId }) {
  return (
    <div className="overflow-x-auto border-t-2 border-ink">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Número</th>
            <th>Fidelización</th>
            <th>Promociones</th>
            <th className="text-right">Visitas</th>
            <th>Última visita</th>
            <th>Canal</th>
            <th className="text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const isPending = pendingVisitId === client.id;
            return (
              <tr
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="cursor-pointer"
              >
                <td className="font-bold text-ink">
                  {client.firstName} {client.lastName}
                </td>
                <td className="whitespace-nowrap tabular-nums">{formatPhone(client.phoneE164)}</td>
                <td className="whitespace-nowrap">
                  <LoyaltyStamps stamps={client.stamps ?? 0} />
                </td>
                <td>
                  <ConsentBadge approved={client.marketingConsent} />
                </td>
                <td className="text-right font-bold tabular-nums">{client.visitCount}</td>
                <td className="whitespace-nowrap text-muted">{formatLimaShort(client.lastVisitAt)}</td>
                <td className="text-sm text-muted">{CHANNEL_LABELS[client.channel] ?? client.channel}</td>
                <td className="text-right">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onQuickVisit) onQuickVisit(client);
                    }}
                    className="inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap border border-accent px-3 text-sm font-bold text-accent-ink transition-colors hover:bg-accent hover:text-on-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-accent-ink"
                    title="Sumar 1 visita a este cliente"
                  >
                    {isPending ? <Spinner size="sm" /> : <span>+1 visita</span>}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
