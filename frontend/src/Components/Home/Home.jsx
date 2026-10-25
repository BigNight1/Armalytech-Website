import { useEffect } from "react";
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
import "react-whatsapp-widget/dist/index.css";
import Navbar from "../Navbar/NavBar.jsx";
import { getPriceRange } from "../../data/pricingData.js";

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
        <title>Reparación de Celulares en Lima: Diagnóstico Gratis</title>
        <meta name="description" content="Servicio técnico de celulares en San Borja. Pantalla en 2–3 horas, batería el mismo día y 3 meses de garantía. Diagnóstico gratis por WhatsApp o en tienda." />
        <link rel="canonical" href="https://www.armalytech.com/" />
        <meta property="og:title" content="Reparación de Celulares en Lima: Diagnóstico Gratis" />
        <meta property="og:description" content="Servicio técnico de celulares en San Borja. Pantalla en 2–3 horas, batería el mismo día y 3 meses de garantía. Diagnóstico gratis por WhatsApp o en tienda." />
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
          "email": "armalycell@gmail.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Av. San Luis 1849-1851, Tienda 127 - MultiMercado San Borja",
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
            "https://www.instagram.com/armalytech/",
            "https://www.tiktok.com/@armalytech"
          ],
          "priceRange": getPriceRange(),
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
