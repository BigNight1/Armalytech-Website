import { Helmet } from 'react-helmet-async';
import { Link } from "react-router-dom";
import Navbar from "../Navbar/NavBar.jsx";
import Footer from "../Footer.jsx";
import "../pricing-hero.css";
import "./contact-page.css";
import ContactSection from "../ContactSection.jsx";

const PHONE = "+51 924 548 268";
const PHONE_LINK = "tel:+51924548268";
const ADDRESS = "Av. San Luis 1873, Tienda 127, San Borja 15021 - MultiMercado San Borja";
const HORARIO = "Lun–Sáb 10:00 – 20:00";

const SERVICIO_TERMS = [
  { label: "Diagnóstico gratuito", desc: "Toda reparación comienza con un diagnóstico sin costo, por WhatsApp o en tienda, para identificar el problema con precisión." },
  { label: "Precios transparentes", desc: "Recibirás un presupuesto detallado antes de iniciar cualquier trabajo, sin sorpresas ni cobros ocultos." },
  { label: "Repuestos de calidad", desc: "Usamos solo repuestos de alta calidad para asegurar el rendimiento y la durabilidad óptimos de tu equipo." },
  { label: "Reparaciones rápidas", desc: "Cambiamos el puerto de carga en 1 a 2 horas y la pantalla en 2 a 3 horas; si dejas un adelanto, la pantalla se trae antes y el cambio toma menos de 1 hora. En el resto de servicios, confirmamos el tiempo después del diagnóstico gratuito." },
];

const WARRANTY_ITEMS = [
  { label: "Garantía de 3 meses", desc: "El repuesto que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola." },
  { label: "Exclusiones", desc: "La garantía no cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros." },
];

const CUSTOMER_ITEMS = [
  { label: "Soporte dedicado", desc: "Nuestro equipo está disponible para responder cualquier duda antes, durante y después de la reparación." },
  { label: "Tu opinión importa", desc: "Valoramos tu experiencia y buscamos mejorar continuamente. Comparte cómo te atendimos." },
];

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Contacto y Ubicación en San Borja | ArmalyTech</title>
        <meta name="description" content="Reparamos tu celular en Av. San Luis 1873, Tienda 127, San Borja, Lima. Lun–Sáb 10:00 – 20:00. Llama al +51 924 548 268 o escríbenos por WhatsApp." />
        <link rel="canonical" href="https://www.armalytech.com/contactanos" />
        <meta property="og:title" content="Contacto y Ubicación en San Borja | ArmalyTech" />
        <meta property="og:description" content="Visítanos en Av. San Luis 1873, Tienda 127, San Borja. Atención Lun–Sáb 10:00 – 20:00. Llama o escríbenos por WhatsApp." />
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
            <p className="contact-info__desc mt-4">
              <Link to="/garantia" className="font-semibold text-[#ff5a2a] hover:underline">Ver la política de garantía completa</Link>
            </p>
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
          <p className="contact-info__desc mt-4">
            ¿Quieres saber cómo llegar o qué reparamos? Mira nuestra página de{" "}
            <Link to="/reparacion-de-celulares-san-borja" className="font-semibold text-[#ff5a2a] hover:underline">reparación de celulares en San Borja</Link>.
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
