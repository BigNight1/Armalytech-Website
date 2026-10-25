import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../Components/Navbar/NavBar.jsx';
import Footer from '../Components/Footer.jsx';
import TicketSkeleton from './components/TicketSkeleton.jsx';
import TicketNotFound from './components/TicketNotFound.jsx';
import TicketDemoSelector from './components/TicketDemoSelector.jsx';
import TicketView from './components/TicketView.jsx';
import { ticketApi } from './api/ticketApi.js';
import { getDemoTicket } from './fixtures/demoTicket.js';
import './theme/tokens.css';

/**
 * How often the public page re-reads the ticket while it is open.
 *
 * The page tells the customer "esta página se actualiza sola" (TicketHero
 * subtitles, `ticketPresenter.js`), so that promise has to be true: the client
 * leaves the link open on their phone and expects to see the repair advance
 * without refreshing. Polling is deliberate over SSE here — `/api/events`
 * requires an admin session (ADR 0028) and this page is anonymous; a 30 s
 * read of a single document is cheap and needs no server state.
 *
 * Overridable so the Playwright suite can assert the refresh without waiting
 * 30 s (`frontend/.env.e2e` sets it to 2000).
 */
const REFRESH_MS = Number(import.meta.env.VITE_TICKET_REFRESH_MS) || 30_000;

/**
 * Public ticket status page — `/ticket/:token` (ADR 0006 `publicToken`,
 * unguessable; the human-readable `codigo`, e.g. "AT-000148", is display-only
 * and never used to look the ticket up). No session, no admin chrome: reuses
 * the site's own NavBar/Footer because the design board depicts the exact
 * same header (logo + Nosotros/Precios/Servicios/Contacto + phone +
 * "Solicitar cotización", matching `menuItems.json`) and footer (same three
 * link columns + brand column, matching `Components/Footer.jsx`) — not a
 * bespoke board-only chrome, so App.jsx's `hideSiteChrome` intentionally
 * does NOT include this route and the WhatsApp widget stays visible like any
 * other public page.
 *
 * Light mode only ("solo modo claro" per the design's own caption); tokens
 * and Archivo are scoped to `.ticket-page` (see theme/tokens.css) so the
 * rest of the public site is untouched.
 */
export default function TicketPage() {
  const { token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const demoEstado = import.meta.env.DEV ? searchParams.get('demo') : null;

  const [status, setStatus] = useState(demoEstado ? 'ready' : 'loading'); // loading | notFound | ready
  const [ticket, setTicket] = useState(demoEstado ? getDemoTicket(demoEstado) : null);

  useEffect(() => {
    if (demoEstado) {
      const demoTicket = getDemoTicket(demoEstado);
      setTicket(demoTicket);
      setStatus(demoTicket ? 'ready' : 'notFound');
      return;
    }

    let cancelled = false;

    // `silent` refreshes keep the last good snapshot on screen: a transient
    // network blip must not replace a valid ticket with the "not found" page.
    const load = async (silent = false) => {
      if (!silent) setStatus('loading');
      try {
        const data = await ticketApi.getPublicTicket(token);
        if (cancelled) return;
        setTicket(data);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        // Only a first load can become "not found"; a failed background
        // refresh leaves what the customer is already reading.
        setStatus((previous) => (previous === 'ready' ? 'ready' : 'notFound'));
      }
    };

    load();

    const refresh = () => {
      if (!document.hidden) load(true);
    };
    const intervalId = setInterval(refresh, REFRESH_MS);
    // Also refresh immediately when the tab becomes visible again: phones
    // suspend timers in background tabs, so a returning customer would
    // otherwise keep seeing a stale status for up to REFRESH_MS.
    document.addEventListener('visibilitychange', refresh);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [token, demoEstado]);

  const selectDemo = (estado) => {
    const next = new URLSearchParams(searchParams);
    next.set('demo', estado);
    setSearchParams(next, { replace: true });
  };

  const demoSelector =
    import.meta.env.DEV && demoEstado ? (
      <TicketDemoSelector current={demoEstado} onSelect={selectDemo} />
    ) : null;

  return (
    <div className="ticket-page font-archivo">
      <Helmet>
        <title>Estado de tu reparación · ArmalyTech</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        {status === 'loading' && (
          <div className="pt-10 md:pt-14 pb-16">
            <TicketSkeleton />
          </div>
        )}
        {status === 'notFound' && (
          <div className="py-16">
            <TicketNotFound />
          </div>
        )}
        {status === 'ready' && ticket && <TicketView ticket={ticket} demoSelector={demoSelector} />}
      </main>

      <Footer />
    </div>
  );
}
