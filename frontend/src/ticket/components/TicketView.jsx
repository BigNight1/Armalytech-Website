import { Link } from 'react-router-dom';
import TicketHero from './TicketHero.jsx';
import TicketSteps from './TicketSteps.jsx';
import TicketClosedBanner from './TicketClosedBanner.jsx';
import TicketContact from './TicketContact.jsx';
import { presentTicket } from '../lib/ticketPresenter.js';

/** Full ticket page body once data is loaded — page header + hero + tracker/banner + contact. */
export default function TicketView({ ticket, demoSelector }) {
  const presented = presentTicket(ticket);
  const { codigo, showSteps, showClosedBanner, steps, estado } = presented;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-6 lg:gap-12 items-end pt-10 md:pt-14 pb-8 md:pb-10 border-b-2 border-[var(--tk-text)]">
        <div className="flex flex-col gap-4">
          <nav className="flex items-center gap-2.5 text-sm text-[var(--tk-muted)]" aria-label="Breadcrumb">
            <Link to="/" className="text-[var(--tk-muted)] hover:text-[var(--tk-text)]">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-[var(--tk-muted)]">Mi ticket</span>
            <span>/</span>
            <span className="font-bold" style={{ color: 'var(--tk-accent-ink)' }}>
              {codigo}
            </span>
          </nav>
          <h1 className="text-[40px] leading-[0.95] md:text-[64px] lg:text-[80px] font-extrabold tracking-tight">
            Estado de tu
            <br />
            reparación
            <span style={{ color: 'var(--tk-accent-500)' }}>.</span>
          </h1>
        </div>
        <p className="text-base md:text-[17px] leading-relaxed text-[var(--tk-muted)]" style={{ textWrap: 'pretty' }}>
          <strong className="text-[var(--tk-text)]">Enlace privado.</strong> Guarda esta página: se actualiza sola
          cuando tu equipo cambia de estado. No necesitas contraseña.
        </p>
      </div>

      <div className="flex flex-col gap-8 md:gap-10 py-8 md:py-10">
        {demoSelector}

        <TicketHero presented={presented} />

        {showSteps && <TicketSteps steps={steps} />}
        {showClosedBanner && <TicketClosedBanner estado={estado} />}

        <TicketContact />

        <p className="text-sm text-[var(--tk-muted)]">
          Enlace privado del ticket {codigo} ·{' '}
          {typeof window !== 'undefined'
            ? `${window.location.host}${window.location.pathname}`
            : `armalytech.com/ticket/${ticket.publicToken || ticket.token || ''}`}
        </p>
      </div>
    </>
  );
}
