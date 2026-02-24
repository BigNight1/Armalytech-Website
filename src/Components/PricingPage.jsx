import React, { useEffect } from "react";
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

      {/* Listado de categorías — zig-zag: par imagen izq, impar contenido izq */}
      <main>
        {pricingCategories.map((category, index) => (
          <PricingBlock
            key={category.id}
            id={category.id}
            title={category.title}
            image={category.image}
            items={category.items}
            imageLeft={index % 2 === 0}
          />
        ))}

        <AdditionalServicesSection />
      </main>
      <ContactSection />
      <Footer />
    </div>
  );
};

export default PricingPage;
