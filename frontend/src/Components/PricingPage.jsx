import { useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import PricingBlock from "./PricingBlock.jsx";
import AdditionalServicesSection from "./AdditionalServicesSection.jsx";
import Navbar from "./Navbar/NavBar.jsx";
import Footer from "./Footer.jsx";
import { pricingCategories, getDesde, getDisplayItems, formatSoles, formatPrice, getRow } from "../data/pricingData.js";
import ContactSection from "./ContactSection.jsx";
import "./pricing-hero.css";

// Los montos salen de data/pricingData.js (única fuente de precios).
const SCREEN_DESDE = formatSoles(getDesde("reparacion-pantalla"));
const SCREEN_RANGE = formatPrice(getRow("reparacion-pantalla", "oled"));
const TITLE = `Cuánto cuesta cambiar la pantalla de un celular: desde ${SCREEN_DESDE}`;
const DESCRIPTION = `Cambio de pantalla de celular desde ${SCREEN_DESDE} (${SCREEN_RANGE} según el modelo) y batería desde ${formatSoles(getDesde("cambio-bateria"))}. Precios en Lima con diagnóstico gratis y 3 meses de garantía.`;
const SITE = "https://www.armalytech.com";
const BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": `${SITE}/` },
    { "@type": "ListItem", "position": 2, "name": "Precios", "item": `${SITE}/precios` },
  ],
};

const PricingPage = () => {
  const { state } = useLocation();

  useEffect(() => {
    const slug = state?.scrollTo;
    if (slug) {
      requestAnimationFrame(() => {
        const el = document.getElementById(slug);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }, [state?.scrollTo]);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href="https://www.armalytech.com/precios" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content="https://www.armalytech.com/precios" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(BREADCRUMB_SCHEMA)}</script>
      </Helmet>
      <Navbar />
      {/* Bloque separado del header: hero de precios con fondo oscuro (estilo TechPro) */}
      <div className="pricing-hero-section">
        <div className="pricing-hero">
          <div className="pricing-hero__inner">
            <h1 className="pricing-hero__title">
              Precios de reparación de celulares en Lima<span className="pricing-hero__title-accent">.</span>
            </h1>
            <nav className="pricing-hero__breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Inicio</Link>
              <span className="pricing-hero__breadcrumb-sep">→</span>
              <span className="pricing-hero__breadcrumb-current">Precios</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Aviso: precios en promedio */}
      <div className="pricing-disclaimer">
        <p className="pricing-disclaimer__text">
          <span className="pricing-disclaimer__label">Precios &ldquo;desde&rdquo;.</span> Son valores de referencia: el precio final depende del modelo de tu equipo y del tipo de repuesto. Te damos la cotización exacta después del diagnóstico gratuito, antes de iniciar cualquier trabajo.
        </p>
        <p className="pricing-disclaimer__text">
          <span className="pricing-disclaimer__label">¿Lo necesitas el mismo día?</span> Deja un adelanto de la mitad del costo del repuesto, lo traemos del almacén y, cuando llega, instalamos tu repuesto nuevo en menos de 1 hora. En el puerto de carga no hace falta adelanto: tenemos zócalos de carga en stock para la mayoría de modelos, así que la reparación se hace al momento.
        </p>
        <p className="pricing-disclaimer__text">
          <span className="pricing-disclaimer__label">Antes de decidir.</span> Revisa qué cubre nuestra <Link to="/garantia" className="underline">garantía de 3 meses</Link> y, si prefieres cotizar tu modelo, mira cómo llegar o escribirnos en la página de <Link to="/contactanos" className="underline">contacto</Link>.
        </p>
      </div>

      {/* Listado de categorías — zig-zag: par imagen izq, impar contenido izq */}
      <main>
        {pricingCategories.map((category, index) => {
          const serviceLinks = {
            "reparacion-pantalla": "/servicios/reparacion-de-pantalla",
            "cambio-bateria": "/servicios/cambio-de-bateria",
            "puerto-carga": "/servicios/reparacion-puerto-de-carga",
            "danio-agua": "/servicios/restauracion-dano-de-agua",
            "software": "/servicios/problemas-de-software"
          };
          return (
            <PricingBlock
              key={category.id}
              id={category.id}
              title={category.title}
              image={category.image}
              items={getDisplayItems(category.id)}
              imageLeft={index % 2 === 0}
              link={serviceLinks[category.id]}
            />
          );
        })}

        <AdditionalServicesSection />
      </main>
      <ContactSection />
      <Footer />
    </div>
  );
};

export default PricingPage;
