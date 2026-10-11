/**
 * Header stat row (design: 3-col strip under the "Clientes" title, strong
 * top rule, thin dividers between cells). Shows zeros while there's no
 * data, so the page never looks broken.
 */
export default function StatCards({ totalClients, visitsToday, approvedConsent }) {
  const cards = [
    { label: 'Clientes', value: totalClients },
    { label: 'Visitas hoy', value: visitsToday, accent: true },
    { label: 'Con consentimiento', value: approvedConsent },
  ];

  return (
    <div className="grid grid-cols-1 border-t-2 border-ink sm:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className={`flex flex-col gap-1 py-3.5 pr-5 ${index > 0 ? 'border-t-2 border-line sm:border-l-2 sm:border-t-0 sm:pl-5' : ''}`}
        >
          <span className={`text-[40px] font-extrabold leading-none tracking-tight ${card.accent ? 'text-accent-ink' : 'text-ink'}`}>
            {card.value}
          </span>
          <span className="text-[15px] text-muted">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
