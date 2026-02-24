import React from "react";
import ScrollToLink from "./ScrollToLink.jsx";

const PHONE = "+51 924 548 268";
const PHONE_LINK = "tel:+51924548268";

const CARDS = [
  {
    id: 1,
    title: "Servicio con garantía",
    description: "Reparaciones con garantía según el servicio.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Reparación rápida",
    description: "Tiempos ágiles y atención clara.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Diagnóstico gratis",
    description: "Evaluación sin costo en muchos casos.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Atención al cliente",
    description: "Soporte y seguimiento personalizado.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const CtaSection = () => {
  return (
    <>
      {/* CTA principal: fondo con imagen + overlay. Sin overflow-hidden para que las tarjetas sobresalgan. */}
      <section className="relative min-h-0 md:min-h-[440px] pt-10 md:pt-28 pb-14 md:pb-32 overflow-visible" id="testimonios">
        {/* Imagen de fondo (cover) + overlay oscuro */}
        <div className="absolute inset-0 z-0">
          <img
            src="/cta.webp"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 z-[1]" />
        </div>

        {/* Contenido superior: izquierda (kicker + título) y derecha (párrafo + botón) */}
        <div className="relative z-10 max-w-[1160px] mx-auto px-4 md:px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-end">
            {/* Izquierda: kicker + título */}
            <div>
              <p className="text-[#ff5a2a] text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-2 md:mb-3">
                CTA
              </p>
              <h2 className="text-white text-2xl md:text-4xl lg:text-[2.75rem] font-semibold leading-tight">
                Contáctanos y obtén{" "}
                <span className="text-[#ff5a2a]">20%</span>
                {" "}de descuento en tu servicio<span className="text-[#ff5a2a]">.</span>
              </h2>
            </div>
            {/* Derecha: texto + botón */}
            <div className="flex flex-col items-start md:items-end md:text-right gap-3 md:gap-4">
              <p className="text-white/85 text-sm md:text-lg max-w-md">
                El descuento aplica en tu primer servicio de reparación en ArmalyTech.
              </p>
              <ScrollToLink
                to="contacto"
                className="inline-block px-6 md:px-8 py-3 md:py-3.5 bg-[#ff5a2a] text-white font-semibold rounded-lg hover:bg-[#e54e1f] transition-colors cursor-pointer text-sm md:text-base"
              >
                Contáctanos
              </ScrollToLink>
            </div>
          </div>
        </div>

        {/* Tarjetas: en móvil sin translateY (flujo normal), en desktop flotan */}
        <div className="relative z-20 max-w-[1160px] mx-auto px-4 md:px-6 w-full mt-8 md:mt-16 md:translate-y-[90px] md:-mb-[90px]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 justify-items-center">
            {CARDS.map((card) => (
              <div
                key={card.id}
                className="w-full max-w-[280px] min-h-0 md:min-h-[210px] bg-white rounded-2xl p-4 md:p-7 shadow-lg border border-gray-100"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#ff5a2a]/15 flex items-center justify-center text-[#ff5a2a] mb-3 md:mb-4">
                  {card.icon}
                </div>
                <h3 className="text-gray-900 font-bold text-sm md:text-lg mb-1 pb-1 border-b-2 border-[#ff5a2a] w-fit">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barra CTA inferior (blanco): padding-top generoso para dejar espacio a las tarjetas flotantes */}
      <section className="bg-white pt-10 md:pt-36 pb-10 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#ff5a2a] text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-3">
            LLÁMANOS
          </p>
          <h2 className="text-gray-900 text-2xl md:text-3xl font-semibold mb-4">
            Contáctanos ahora para reparaciones rápidas y confiables!
          </h2>
          <p className="text-gray-600 text-base md:text-lg">
            Agenda tu reparación hoy:{" "}
            <a
              href={PHONE_LINK}
              className="text-[#ff5a2a] font-semibold underline underline-offset-2 hover:text-[#e54e1f] transition-colors"
            >
              {PHONE}
            </a>
          </p>
        </div>
      </section>
    </>
  );
};

export default CtaSection;
