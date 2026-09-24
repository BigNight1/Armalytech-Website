import ConsentBadge from './ConsentBadge.jsx';
import LoyaltyStamps from './LoyaltyStamps.jsx';
import { formatPhone, formatLimaShort } from '../lib/format.js';

const CHANNEL_LABELS = { qr: 'QR', nfc: 'NFC', manual: 'Manual' };

/** Clientes table with loyalty stamps and quick visit action. */
export default function ClientsTable({ clients, onSelectClient, onRegisterVisit }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="min-w-full divide-y divide-slate-700 text-sm">
        <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Apellido</th>
            <th className="px-4 py-3">Número</th>
            <th className="px-4 py-3">Fidelización</th>
            <th className="px-4 py-3">Acepta promociones</th>
            <th className="hidden px-4 py-3 md:table-cell">Visitas</th>
            <th className="hidden px-4 py-3 md:table-cell">Última visita</th>
            <th className="hidden px-4 py-3 md:table-cell">Canal</th>
            <th className="px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {clients.map((client) => (
            <tr
              key={client.id}
              onClick={() => onSelectClient(client)}
              className="cursor-pointer text-brand-ink hover:bg-slate-800/60 transition-colors"
            >
              <td className="px-4 py-3 font-medium">{client.firstName}</td>
              <td className="px-4 py-3">{client.lastName}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatPhone(client.phoneE164)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <LoyaltyStamps stamps={client.stamps ?? 0} />
              </td>
              <td className="px-4 py-3">
                <ConsentBadge approved={client.marketingConsent} />
              </td>
              <td className="hidden px-4 py-3 md:table-cell font-semibold">{client.visitCount}</td>
              <td className="hidden px-4 py-3 md:table-cell whitespace-nowrap text-xs text-slate-400">
                {formatLimaShort(client.lastVisitAt)}
              </td>
              <td className="hidden px-4 py-3 md:table-cell text-xs text-slate-400">
                {CHANNEL_LABELS[client.channel] ?? client.channel}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRegisterVisit) onRegisterVisit(client);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-orange/40 bg-brand-orange/10 px-2.5 py-1 text-xs font-semibold text-brand-orange hover:bg-brand-orange hover:text-white transition-colors"
                  title="Sumar 1 visita a este cliente"
                >
                  <span>+1 Visita</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
