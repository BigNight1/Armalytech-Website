import ConsentBadge from './ConsentBadge.jsx';
import { formatPhone, formatLimaShort } from '../lib/format.js';

const CHANNEL_LABELS = { qr: 'QR', nfc: 'NFC' };

/** Clientes table. Visitas/última visita/canal are secondary columns, hidden on mobile. */
export default function ClientsTable({ clients, onSelectClient }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="min-w-full divide-y divide-slate-700 text-sm">
        <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Apellido</th>
            <th className="px-4 py-3">Número</th>
            <th className="px-4 py-3">Acepta promociones</th>
            <th className="hidden px-4 py-3 md:table-cell">Visitas</th>
            <th className="hidden px-4 py-3 md:table-cell">Última visita</th>
            <th className="hidden px-4 py-3 md:table-cell">Canal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {clients.map((client) => (
            <tr
              key={client.id}
              onClick={() => onSelectClient(client)}
              className="cursor-pointer text-brand-ink hover:bg-slate-800/60"
            >
              <td className="px-4 py-3">{client.firstName}</td>
              <td className="px-4 py-3">{client.lastName}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatPhone(client.phoneE164)}</td>
              <td className="px-4 py-3">
                <ConsentBadge approved={client.marketingConsent} />
              </td>
              <td className="hidden px-4 py-3 md:table-cell">{client.visitCount}</td>
              <td className="hidden px-4 py-3 md:table-cell whitespace-nowrap">
                {formatLimaShort(client.lastVisitAt)}
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                {CHANNEL_LABELS[client.channel] ?? client.channel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
