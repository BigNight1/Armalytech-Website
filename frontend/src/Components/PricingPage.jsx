import React, { useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import PricingBlock from "./PricingBlock.jsx";
import AdditionalServicesSection from "./AdditionalServicesSection.jsx";
import Navbar from "./Navbar/NavBar.jsx";
import Footer from "./Footer.jsx";
import { pricingCategories } from "../data/pricingData.js";
import ContactSection from "./ContactSection.jsx";
import "./pricing-hero.css";

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
        <title>Precios de Reparación de Celulares en Lima | ArmalyTech</title>
        <meta name="description" content="Consulta nuestros precios de reparación de celulares en Lima: cambio de pantalla desde S/ 69, batería desde S/ 97, puerto de carga desde S/ 38. Cotización gratuita." />
        <link rel="canonical" href="https://www.armalytech.com/precios" />
        <meta property="og:title" content="Precios de Reparación de Celulares | ArmalyTech Lima" />
        <meta property="og:description" content="Precios claros y sin sorpresas. Cambio de pantalla, batería, puerto de carga y más. Diagnóstico gratis en San Borja, Lima." />
        <meta property="og:url" content="https://www.armalytech.com/precios" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      {/* Bloque separado del header: hero de precios con fondo oscuro (estilo TechPro) */}
      <div className="pricing-hero-section">
        <div className="pricing-hero">
          <div className="pricing-hero__inner">
            <h1 className="pricing-hero__title">
              Precios<span className="pricing-hero__title-accent">.</span>
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
          <span className="pricing-disclaimer__label">Promedio.</span> Los precios son de referencia y pueden variar según el modelo del equipo, la marca y el tipo de falla. Te damos una cotización exacta al revisar tu celular.
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
              items={category.items}
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
