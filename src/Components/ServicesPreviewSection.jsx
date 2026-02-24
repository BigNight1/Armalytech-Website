import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SERVICIOS = [
  {
    id: 1,
    slug: "reparacion-pantalla",
    title: "Reparación de pantalla",
    description: "Recupera la claridad de tu pantalla con reparación rápida y precisa.",
    image: "/precio/Reparaciónpantalla.webp",
    precioPromedio: "120",
  },
  {
    id: 2,
    slug: "cambio-bateria",
    title: "Cambio de batería",
    description: "Recupera la duración de tu batería con reemplazos y pruebas confiables.",
    image: "/precio/Cambiobatería.webp",
    precioPromedio: "115",
  },
  {
    id: 3,
    slug: "puerto-carga",
    title: "Puerto de carga",
    description: "Reparamos y limpiamos el puerto de carga para que cargue bien.",
    image: "/precio/Reparaciónpuertocarga.webp",
    precioPromedio: "85",
  },
  {
    id: 4,
    slug: "danio-agua",
    title: "Daño por agua",
    description: "Rescatamos tu equipo de la humedad con limpieza y reparación profesional.",
    image: "/precio/Restauracióndañoagua.webp",
    precioPromedio: "90",
  },
  {
    id: 5,
    slug: "software",
    title: "Problemas de software",
    description: "Diagnóstico, actualizaciones y optimización del sistema.",
    image: "/precio/Problemassoftware.webp",
    precioPromedio: "45",
  },
];

const ServicesPreviewSection = () => {
  const [inicio, setInicio] = useState(0);
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const actualizar = () => setVisible(window.innerWidth >= 768 ? 3 : 1);
    actualizar();
    window.addEventListener("resize", actualizar);
    return () => window.removeEventListener("resize", actualizar);
  }, []);

  const total = SERVICIOS.length;
  const maxInicio = Math.max(0, total - visible);
  const puedeIrIzquierda = inicio > 0;
  const puedeIrDerecha = inicio < maxInicio;
  const mostrar = SERVICIOS.slice(inicio, inicio + visible);

  const irIzquierda = () => setInicio((i) => Math.max(0, i - 1));
  const irDerecha = () => setInicio((i) => Math.min(maxInicio, i + 1));

  return (
    <section className="bg-white py-16 md:py-24 px-4" id="services">
      <div className="max-w-[1160px] mx-auto">
        <p className="text-[#ff5a2a] text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-3">
          Servicios
        </p>
        <h2 className="text-gray-900 text-2xl md:text-4xl lg:text-[2.5rem] font-semibold leading-tight mb-3">
          Reparamos celulares, eso es todo<span className="text-[#ff5a2a]">.</span>
        </h2>
        <p className="text-gray-600 text-lg mb-14 md:mb-12">
          Conoce más sobre nuestros servicios.
        </p>

        <div className="relative">
          {/* Flecha izquierda */}
          <button
            type="button"
            onClick={irIzquierda}
            disabled={!puedeIrIzquierda}
            aria-label="Ver servicios anteriores"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-8 z-10 w-9 h-9 md:w-12 md:h-12 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-[#ff5a2a] hover:text-[#ff5a2a] disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Flecha derecha */}
          <button
            type="button"
            onClick={irDerecha}
            disabled={!puedeIrDerecha}
            aria-label="Ver más servicios"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-8 z-10 w-9 h-9 md:w-12 md:h-12 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-[#ff5a2a] hover:text-[#ff5a2a] disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 px-8 md:px-0">
            {mostrar.map((card) => (
              <article key={card.id} className="bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0 min-w-0">
                <div className="aspect-video w-full overflow-hidden bg-gray-100">
                  <img
                    src={card.image}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "https://placehold.co/400x225/f3f4f6/9ca3af?text=Servicio"; }}
                  />
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="text-gray-900 font-semibold text-xl mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {card.description}
                  </p>
                  <p className="text-gray-700 text-sm font-medium mb-4">
                    Precio promedio: <span className="text-[#ff5a2a] font-semibold">S/ {card.precioPromedio}</span>
                  </p>
                  <Link
                    to="/precios"
                    state={{ scrollTo: card.slug }}
                    className="inline-block w-full text-center px-5 py-3 bg-[#ff5a2a] text-white font-semibold rounded-lg hover:bg-[#e54e1f] transition-colors"
                  >
                    Ver precios
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="flex justify-center gap-1.5 mt-6">
            {SERVICIOS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInicio(Math.min(i, maxInicio))}
                aria-label={`Ir a servicio ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${i >= inicio && i < inicio + visible ? "bg-[#ff5a2a]" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreviewSection;
