import React, { useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { useLocation } from "react-router-dom";
import Hero from "../Hero.jsx";
import RepairsSection from "../RepairsSection.jsx";
import AboutSection from "../AboutSection.jsx";
import StepsSection from "../StepsSection.jsx";
import ServicesPreviewSection from "../ServicesPreviewSection.jsx";
import FaqSection from "../FaqSection.jsx";
import CtaSection from "../CtaSection.jsx";
import ContactSection from "../ContactSection.jsx";
import Footer from "../Footer.jsx";
import { WhatsAppWidget } from "react-whatsapp-widget";
import "react-whatsapp-widget/dist/index.css";
import Navbar from "../Navbar/NavBar.jsx";

const Home = () => {
  const { state } = useLocation();

  useEffect(() => {
    const scrollTo = state?.scrollTo;
    if (scrollTo) {
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollTo);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }, [state?.scrollTo]);

  return (
    <div>
      <Helmet>
        <title>Reparación de Celulares en Lima | ArmalyTech — San Borja</title>
        <meta name="description" content="Servicio técnico de celulares en Lima. Cambiamos pantallas, baterías, puertos de carga y reparamos daño por agua. Diagnóstico gratuito en San Borja. ¡Llámanos!" />
        <link rel="canonical" href="https://www.armalytech.com/" />
        <meta property="og:title" content="Reparación de Celulares en Lima | ArmalyTech" />
        <meta property="og:description" content="Servicio técnico de celulares en Lima. Diagnóstico gratuito, repuestos de calidad y garantía incluida. Visítanos en San Borja." />
        <meta property="og:url" content="https://www.armalytech.com/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ElectronicsRepair",
          "name": "ArmalyTech",
          "url": "https://www.armalytech.com",
          "logo": "https://www.armalytech.com/logo.webp",
          "image": "https://www.armalytech.com/armalytech.webp",
          "description": "Servicio técnico especializado en reparación de celulares en Lima. Cambio de pantalla, batería, puerto de carga y restauración por daño de agua. Diagnóstico gratuito.",
          "telephone": "+51924548268",
          "email": "armalytech@email.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Av. San Luis 1859 - MultiMercado San Borja",
            "addressLocality": "San Borja",
            "addressRegion": "Lima",
            "postalCode": "15021",
            "addressCountry": "PE"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": -12.085994,
            "longitude": -76.996598
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
              "opens": "10:00",
              "closes": "20:00"
            }
          ],
          "sameAs": [
            "https://instagram.com/armalytech",
            "https://api.whatsapp.com/send/?phone=%2B51924548268"
          ],
          "priceRange": "S/ 30 – S/ 185",
          "currenciesAccepted": "PEN",
          "paymentAccepted": "Efectivo, Transferencia bancaria, Pago digital",
          "areaServed": {
            "@type": "City",
            "name": "Lima"
          }
        })}</script>
      </Helmet>
      <div className="hero-container relative">
        <Navbar />
        <Hero />
      </div>
      <RepairsSection />
      <AboutSection />
      <StepsSection />
      <ServicesPreviewSection />
      <CtaSection />
      <FaqSection />
      <ContactSection />
      <Footer />
      {/* <WhatsAppWidget
        phoneNumber="+51924548268"
        companyName="Armalytech"
        message="Hola! ¿Cómo podemos ayudarte?"
        replyTimeText="Normalmente respondemos en unos minutos"
      /> */}
    </div>
  );
};

export default Home;
