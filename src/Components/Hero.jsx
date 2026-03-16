import React from "react";
import { Link } from "react-router-dom";
import { Element } from "react-scroll";
import ScrollToLink from "./ScrollToLink.jsx";

const Hero = () => {
  return (
    <Element name="Home">
      <section className="hero-section relative z-10 min-h-[calc(100vh-10rem)] pt-[10rem] pb-16 md:pt-[12rem] md:pb-32 lg:pt-[14rem] lg:pb-36 px-3 md:px-4 lg:px-6">
        <div className="max-w-screen-xl mx-auto px-6 py-8 md:py-14 lg:py-20 sm:px-6">
          {/* Grid: 3 cols desktop, 2 cols tablet (texto+teléfono | derecha), 1 col mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 items-center">
            {/* COLUMNA IZQUIERDA - Texto: izquierda en móvil, bien acomodado */}
            <div className="order-1 md:order-1 lg:col-span-1 flex flex-col justify-center text-left">
              <p className="text-orange-500 text-xs md:text-sm font-bold uppercase tracking-widest mb-3">
                Bienvenido a Armalytech
              </p>
              <h1 className="text-white font-bold leading-tight mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                No esperes,
                <br />
                repara <span className="text-orange-500">hoy.</span>
              </h1>
              <p className="text-gray-300 text-lg md:text-xl font-semibold mb-4">
                Confía en Armalytech – Donde la tecnología encuentra al profesional.
              </p>
              <p className="text-gray-400 text-sm md:text-base font-medium mb-6 max-w-md mr-auto">
                No dejes que los problemas técnicos te frenen. En Armalytech estamos para darle nueva vida a tus equipos, de forma rápida y sin complicaciones.
              </p>
              <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1 text-xs md:text-sm uppercase text-gray-400 mb-8">
                <Link to="/contactanos" className="underline underline-offset-2 hover:text-gray-300 opacity-90">
                  Política de garantía
                </Link>
                <span className="text-gray-600">·</span>
                <Link to="/contactanos" className="underline underline-offset-2 hover:text-gray-300 opacity-90">
                  Términos de servicio
                </Link>
                <span className="text-gray-600">·</span>
                <Link to="/contactanos" className="underline underline-offset-2 hover:text-gray-300 opacity-90">
                  Soporte
                </Link>
              </div>
              {/* <div className="flex items-center gap-3 justify-start">
                <button
                  type="button"
                  aria-label="Ver video"
                  className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors shrink-0"
                >
                  <span className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-orange-500 border-b-[6px] border-b-transparent ml-0.5" />
                </button>
                <span className="text-white font-medium">Ver video</span>
              </div> */}
            </div>

            {/* COLUMNA CENTRO - Imagen iPhone */}
            <div className="order-2 md:order-2 lg:col-span-1 flex justify-center items-center py-8 lg:py-0">
              <img
                src="/iphone.webp"
                alt="iPhone"
                width={280}
                height={420}
                fetchpriority="high"
                className="w-[min(280px,85vw)] h-auto object-contain drop-shadow-2xl"
              />
            </div>

            {/* COLUMNA DERECHA - Móvil: centrada, descripción estrecha, enlace pequeño. Desktop: como antes (izq, gap grande, enlace grande) */}
            <div className="order-3 md:order-3 lg:col-span-1 rightCol flex flex-col justify-center items-center md:items-start text-center md:text-left w-full max-w-[320px] mx-auto md:mx-0 gap-6 md:gap-12 lg:gap-16">
              <div className="w-full min-w-0 py-2 md:py-0">
                <p className="text-white text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-none mb-1 md:mb-2">
                  1.5k<span className="text-orange-500 ml-0.5">+</span>
                </p>
                <p className="text-gray-400 uppercase opacity-70 text-[10px] sm:text-[11px] md:text-xs" style={{ letterSpacing: "0.18em" }}>
                  Clientes en Lima.
                </p>
              </div>

              <div className="flex flex-col items-center md:items-start gap-3 mb-2 md:mb-4 w-full max-w-[240px] md:max-w-[280px] mx-auto md:mx-0">
                <div
                  className="w-[88px] h-[88px] rounded-full flex-shrink-0 overflow-hidden border-2 border-white/10 shadow-lg"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}
                >
                  <img
                    src="/Tecnico.webp"
                    alt="Técnico experto"
                    width={88}
                    height={88}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-400 text-sm md:text-base opacity-[0.78] text-center md:text-left">
                  Nuestro experto está listo para diagnosticar tu equipo <strong className="text-white font-semibold">gratis</strong>.{" "}
                  <strong className="text-white font-bold" style={{ fontWeight: 700 }}>¡Escríbenos!</strong>
                </p>
              </div>

              <ScrollToLink
                to="services"
                className="text-white font-medium hover:text-orange-500 transition-colors inline-flex items-center flex-nowrap gap-1 group text-base md:text-2xl justify-center md:justify-start text-center md:text-left whitespace-normal md:whitespace-nowrap"
              >
                Obtener servicios de <span className="underline decoration-orange-500 decoration-2 underline-offset-2">reparación</span>
                <span className="text-orange-500 group-hover:translate-x-1 transition-transform">→</span>
              </ScrollToLink>
            </div>
          </div>
        </div>
      </section>
    </Element>
  );
};

export default Hero;
