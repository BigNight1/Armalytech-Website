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
    setStatus('loading');
    ticketApi
      .getPublicTicket(token)
      .then((data) => {
        if (cancelled) return;
        setTicket(data);
        setStatus('ready');
      })
      .catch(() => {
        // Backend module doesn't exist yet — every real request lands here
        // today (404/network error alike). See api/ticketApi.js contract.
        if (cancelled) return;
        setStatus('notFound');
      });
    return () => {
      cancelled = true;
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
