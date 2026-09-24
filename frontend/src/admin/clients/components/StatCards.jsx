/** Small header stat tiles. Shows zeros while there's no data, so the page never looks broken. */
export default function StatCards({ totalClients, visitsToday, approvedConsent }) {
  const cards = [
    { label: 'Clientes', value: totalClients },
    { label: 'Visitas hoy', value: visitsToday },
    { label: 'Con consentimiento', value: approvedConsent },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3"
        >
          <p className="text-2xl font-bold text-brand-ink">{card.value}</p>
          <p className="text-xs text-slate-400">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
