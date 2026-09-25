/**
 * Shown for an unknown/invalid publicToken — the only outcome every real
 * visit gets today, since the `tickets` backend module doesn't exist yet
 * (see api/ticketApi.js). Kept simple and reassuring rather than a bare
 * error, since a customer reaching this is following a legitimate link.
 */
export default function TicketNotFound() {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-16 md:py-24 border-2 border-[var(--tk-text)]">
      <span
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.08em]"
        style={{ border: '2px solid var(--tk-text)' }}
      >
        Enlace no encontrado
      </span>
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-xl">
        No pudimos encontrar este ticket.
      </h1>
      <p className="text-base md:text-lg text-[var(--tk-muted)] max-w-md leading-relaxed">
        El enlace puede estar mal escrito o el ticket ya no está disponible. Si tienes dudas, escríbenos por
        WhatsApp con tu código de ticket a la mano.
      </p>
      <a
        href="https://api.whatsapp.com/send/?phone=%2B51924548268"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-2 px-5 py-3 font-bold text-[15px] bg-[var(--tk-accent-500)] text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-600)] transition-colors"
      >
        <img src="/redes_sociales/whatsapp.svg" alt="" className="w-5 h-5" />
        <span>Consultar por WhatsApp</span>
      </a>
    </div>
  );
}
