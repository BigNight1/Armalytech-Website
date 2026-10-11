/** WhatsApp CTA + store pickup info (design's bottom two-column section). */
export default function TicketContact() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 border-t-2 border-[var(--tk-text)]">
      <div className="flex flex-col items-start gap-3 py-7 pr-0 md:pr-8">
        <h3 className="text-xl md:text-2xl font-extrabold">¿Dudas con tu reparación?</h3>
        <p className="text-base leading-relaxed text-[var(--tk-muted)]">
          Responde este mismo enlace por WhatsApp y te contestamos con el ticket a la vista.
        </p>
        <a
          href="https://api.whatsapp.com/send/?phone=%2B51924548268"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 mt-1 px-5 py-3 font-bold text-base bg-[var(--tk-accent-500)] text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-600)] transition-colors"
        >
          <img src="/redes_sociales/whatsapp.svg" alt="" className="w-5 h-5" />
          <span>Consultar por WhatsApp</span>
        </a>
      </div>
      <div className="flex flex-col gap-2 py-7 pl-0 md:pl-8 border-t md:border-t-0 md:border-l-2 border-[var(--tk-divider)] mt-6 md:mt-0 pt-6 md:pt-7">
        <h3 className="text-xl md:text-2xl font-extrabold mb-1">Recoge en tienda</h3>
        <p className="text-base leading-relaxed">Av. San Luis 1859, San Borja · MultiMercado San Borja — Lima</p>
        <p className="text-base leading-relaxed">Lun a Sáb · 10:00 a. m. – 8:00 p. m.</p>
        <p className="text-sm text-[var(--tk-muted)] mt-1">Presenta este enlace o tu DNI al recoger el equipo.</p>
      </div>
    </section>
  );
}
