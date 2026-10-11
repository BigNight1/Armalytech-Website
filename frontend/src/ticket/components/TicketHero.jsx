/**
 * Ticket status hero + info grid (design's `<section grid-template-columns:
 * 7fr 5fr>` under `/ticket/AT-2X9K4M`). `presented` is the view model from
 * `lib/ticketPresenter.js` (`presentTicket`).
 */
export default function TicketHero({ presented }) {
  const { codigo, heroCopy, heroStyle, dotColor, dotPulse, info } = presented;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] border-2 border-[var(--tk-text)]">
      <div className="flex flex-col gap-4 items-start p-7 md:p-9" style={heroStyle}>
        <span className="text-sm font-extrabold uppercase tracking-[0.18em]">Ticket {codigo}</span>
        <h2 className="text-[34px] md:text-[52px] font-extrabold tracking-tight leading-[1]">{heroCopy.titulo}</h2>
        <p className="text-base md:text-lg leading-snug max-w-[46ch]">{heroCopy.subtitulo}</p>
        <span
          className="inline-flex items-center gap-2.5 px-3.5 py-2 text-sm font-extrabold uppercase tracking-[0.06em]"
          style={
            heroCopy.tone === 'neutral'
              ? { border: '2px solid var(--tk-text)' }
              : { background: 'rgba(255,255,255,0.16)' }
          }
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${dotPulse ? 'animate-[tk-pulse_1.4s_ease-in-out_infinite]' : ''}`}
            style={{ background: dotColor }}
          />
          {heroCopy.etiqueta}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 border-t-2 lg:border-t-0 lg:border-l-2 border-[var(--tk-text)]">
        {info.map((cell) => (
          <div
            key={cell.label}
            className="p-5 md:p-[22px] border-b border-r border-[var(--tk-divider)] flex flex-col gap-1.5"
          >
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--tk-muted)]">{cell.label}</span>
            <span
              className="text-[17px] font-bold"
              style={cell.accent ? { color: 'var(--tk-accent-ink)' } : undefined}
            >
              {cell.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
