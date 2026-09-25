import { Helmet } from 'react-helmet-async';
import { Link } from "react-router-dom";
import Navbar from "../Navbar/NavBar.jsx";
import Footer from "../Footer.jsx";
import "../pricing-hero.css";
import "./contact-page.css";
import ContactSection from "../ContactSection.jsx";

const PHONE = "+51 924 548 268";
const PHONE_LINK = "tel:+51924548268";
const ADDRESS = "Av. San Luis 1859, San Borja 15021 - MultiMercado San Borja";
const HORARIO = "Lun–Sáb 10AM – 8PM ";

const SERVICIO_TERMS = [
  { label: "Diagnóstico gratuito", desc: "Toda reparación comienza con un diagnóstico sin costo para identificar el problema con precisión." },
  { label: "Precios transparentes", desc: "Recibirás un presupuesto detallado antes de iniciar cualquier trabajo, sin sorpresas ni cobros ocultos." },
  { label: "Repuestos de calidad", desc: "Usamos solo repuestos de alta calidad para asegurar el rendimiento y la durabilidad óptimos de tu equipo." },
  { label: "Reparaciones rápidas", desc: "Nuestros técnicos se esfuerzan por completar las reparaciones en 1–2 días según el tipo de falla." },
];

const WARRANTY_ITEMS = [
  { label: "Garantía de calidad", desc: "Si presentas algún problema relacionado al componente reparado, trae tu equipo dentro de los 14 días para una reevaluación sin costo." },
  { label: "Garantía de repuestos", desc: "Los repuestos utilizados tienen cobertura de 3 meses contra defectos de fabricación." },
  { label: "Exclusiones", desc: "La garantía no cubre daños por accidentes, mal uso, líquidos o modificaciones no autorizadas." },
];

const CUSTOMER_ITEMS = [
  { label: "Soporte dedicado", desc: "Nuestro equipo está disponible para responder cualquier duda antes, durante y después de la reparación." },
  { label: "Tu opinión importa", desc: "Valoramos tu experiencia y buscamos mejorar continuamente. Comparte cómo te atendimos." },
];

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Contáctanos | ArmalyTech — Reparación de Celulares en San Borja, Lima</title>
        <meta name="description" content="Contáctanos para reparar tu celular en Lima. Estamos en Av. San Luis 1859, San Borja. Atención Lun–Sáb 10AM–8PM. Llama al +51 924 548 268 o escríbenos por WhatsApp." />
        <link rel="canonical" href="https://www.armalytech.com/contactanos" />
        <meta property="og:title" content="Contacto | ArmalyTech San Borja Lima" />
        <meta property="og:description" content="Visítanos en Av. San Luis 1859, San Borja. Atención Lun–Sáb 10AM–8PM. Llama o escríbenos por WhatsApp." />
        <meta property="og:url" content="https://www.armalytech.com/contactanos" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />

      {/* Hero — mismo estilo que /precios */}
      <div className="contact-hero-section">
        <div className="contact-hero">
          <div className="contact-hero__inner">
            <h1 className="contact-hero__title">
              Contáctanos<span className="contact-hero__title-accent">.</span>
            </h1>
            <nav className="contact-hero__breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Inicio</Link>
              <span className="contact-hero__breadcrumb-sep">→</span>
              <span className="contact-hero__breadcrumb-current">Contactanos</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Sección info — 2 columnas (estilo Terms & Warranty) */}
      <section className="contact-info">
        <div className="contact-info__container">
         

          {/* Columna izquierda: Términos de Servicio */}
          <div className="contact-info__col">
             {/* Header */}
          <div className="contact-info__header">
            <p className="contact-info__kicker">TÉRMINOS</p>
            <h2 className="contact-info__title">
              Términos &amp; Garantía<span className="contact-info__title-dot">.</span>
            </h2>
            <p className="contact-info__desc">
              En ArmalyTech priorizamos tu satisfacción y respaldamos la calidad de nuestras reparaciones. Esto es lo que debes saber.
            </p>
          </div>
            <h3 className="contact-info__subtitle">Términos de Servicio</h3>
            <ul className="contact-info__terms-list">
              {SERVICIO_TERMS.map((item) => (
                <li key={item.label} className="contact-info__terms-item">
                  <span className="contact-info__bullet" aria-hidden="true" />
                  <span className="contact-info__terms-item-text">
                    <strong>{item.label}:</strong> <span className="contact-info__terms-item-desc">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna derecha: Política de Garantía + Atención al Cliente */}
          <div className="contact-info__col">
            <h3 className="contact-info__subtitle">Política de Garantía</h3>
            <ul className="contact-info__terms-list">
              {WARRANTY_ITEMS.map((item) => (
                <li key={item.label} className="contact-info__terms-item">
                  <span className="contact-info__bullet" aria-hidden="true" />
                  <span className="contact-info__terms-item-text">
                    <strong>{item.label}:</strong> <span className="contact-info__terms-item-desc">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
            <h3 className="contact-info__subtitle contact-info__subtitle--spaced">Atención al Cliente</h3>
            <ul className="contact-info__terms-list">
              {CUSTOMER_ITEMS.map((item) => (
                <li key={item.label} className="contact-info__terms-item">
                  <span className="contact-info__bullet" aria-hidden="true" />
                  <span className="contact-info__terms-item-text">
                    <strong>{item.label}:</strong> <span className="contact-info__terms-item-desc">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Párrafo final a ancho completo */}
        <div className="contact-info__footer">
          <p className="contact-info__closing">
            Si tienes dudas, inquietudes o necesitas orientación, nuestro equipo está a un mensaje o llamada de distancia. Escríbenos para soporte post-reparación, consultas sobre tu equipo o para compartir tu experiencia. Estamos comprometidos con reparaciones excepcionales y un servicio al cliente sin igual. Tu confianza en ArmalyTech es importante; estamos aquí para que tu experiencia sea fluida y sin estrés. Contáctanos hoy.
          </p>
          <p className="contact-info__contact-line">
            <a href={PHONE_LINK}>{PHONE}</a> · {ADDRESS} · {HORARIO}
          </p>
        </div>
      </section>

      {/* Google Maps — 100% ancho */}
      <iframe
        className="contact-map"
        title="Ubicación ArmalyTech"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d289.9719361859796!2d-76.99659845096025!3d-12.085994834346701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c766de68b979%3A0x2e06fa302ff6b50!2sArmalytech!5e0!3m2!1ses-419!2spe!4v1731759574355!5m2!1ses-419!2spe"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* ContactSection */}
       <ContactSection />       
      <Footer />
    </div>
  );
};

export default ContactPage;
