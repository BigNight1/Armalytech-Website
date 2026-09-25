/**
 * 3-column progress tracker (design's `tk.pasos`), shown only for the main
 * path (pendiente → aprobado → trabajando → listo → entregado). `cancelado`
 * and `abandonado` render TicketClosedBanner instead — see TicketView.
 */
export default function TicketSteps({ steps }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 border-t-2 border-[var(--tk-text)]">
      {steps.map((step, i) => (
        <div
          key={step.titulo}
          className={`relative flex flex-col gap-3.5 py-7 ${i === 0 ? 'pr-7 sm:pr-7' : i === 2 ? 'pl-7 sm:pl-7 sm:pr-0' : 'px-7'} ${
            i > 0 ? 'border-t sm:border-t-0 sm:border-l border-[var(--tk-divider)]' : ''
          }`}
        >
          <div
            className="absolute left-0 right-0 -top-[2px] h-1"
            style={{ background: step.done ? '#0f172a' : step.active ? '#f97316' : 'transparent' }}
          />
          <div className="flex items-center justify-between">
            <span
              className="text-3xl md:text-4xl font-extrabold tracking-tight"
              style={{ color: step.on ? 'var(--tk-text)' : 'var(--tk-muted)' }}
            >
              {step.numero}
            </span>
            <span
              className="text-xs font-bold uppercase tracking-[0.06em] px-2 py-1"
              style={
                step.active
                  ? { background: '#f97316', color: '#0f172a' }
                  : step.done
                    ? { background: '#0f172a', color: '#fff' }
                    : { border: '1px solid var(--tk-divider)', color: 'var(--tk-muted)' }
              }
            >
              {step.marca}
            </span>
          </div>
          <img
            src={step.icono}
            alt=""
            className={`w-14 h-14 object-contain ${step.on ? '' : 'opacity-35 grayscale'}`}
          />
          <h3
            className="text-2xl font-extrabold"
            style={{ color: step.on ? 'var(--tk-text)' : 'var(--tk-muted)' }}
          >
            {step.titulo}
          </h3>
          <p className="text-base leading-relaxed" style={{ color: step.on ? 'var(--tk-text)' : 'var(--tk-muted)' }}>
            {step.desc}
          </p>
        </div>
      ))}
    </section>
  );
}
