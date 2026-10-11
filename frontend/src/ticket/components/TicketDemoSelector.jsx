import { DEMO_ESTADOS } from '../fixtures/demoTicket.js';

/**
 * Dev-only "Demo · ver estado" bar — mirrors the design's `mostrarSelector`
 * button row so every ADR 0007 state can be compared visually against the
 * design board. Only rendered by TicketPage when `import.meta.env.DEV` and
 * `?demo=` is present; never shipped in a production build.
 */
export default function TicketDemoSelector({ current, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border border-dashed border-[var(--tk-divider)]">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tk-muted)]">Demo · ver estado</span>
      {DEMO_ESTADOS.map((estado) => (
        <button
          key={estado}
          type="button"
          onClick={() => onSelect(estado)}
          className={`h-9 px-3.5 text-sm font-bold border transition-colors ${
            current === estado
              ? 'bg-[var(--tk-text)] text-white border-[var(--tk-text)]'
              : 'bg-transparent text-[var(--tk-text)] border-[var(--tk-divider)] hover:border-[var(--tk-text)]'
          }`}
        >
          {estado[0].toUpperCase() + estado.slice(1)}
        </button>
      ))}
    </div>
  );
}
