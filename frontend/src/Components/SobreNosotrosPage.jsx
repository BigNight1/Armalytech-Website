import { useState } from "react";
import { Helmet } from 'react-helmet-async';
import { Link } from "react-router-dom";
import Navbar from "./Navbar/NavBar.jsx";
import Footer from "./Footer.jsx";
import "./sobre-nosotros-hero.css";
import "./sobre-nosotros.css";

const PROCESS_STEPS = [
  {
    num: "01.",
    title: "Diagnóstico",
    desc: "Evaluamos tu equipo sin costo, por WhatsApp o en tienda, para identificar el problema con precisión.",
  },
  {
    num: "02.",
    title: "Reparación",
    desc: "Nuestros técnicos realizan la reparación con repuestos de calidad.",
  },
  {
    num: "03.",
    title: "Entrega",
    desc: "Te avisamos cuando esté listo. Prueba y garantía incluida.",
  },
];

const TEAM_MEMBERS = [
  {
    name: "Martin Armas",
    role: "Técnicos especializados en reparación de celulares y equipos tecnológicos.",
    avatar: "/Tecnico.webp",
  },
];

const FAQ_ITEMS = [
  {
    id: 1,
    question: "¿Ofrecen servicio de reparación por envío para clientes fuera de Lima?",
    answer: "Sí. Podemos coordinar reparaciones por envío para clientes fuera de Lima. Escríbenos para indicarte el proceso y las recomendaciones necesarias.",
  },
  {
    id: 2,
    question: "¿Cuánto cuesta una reparación de celular?",
    answer: "El costo depende del tipo de falla y del modelo del equipo. Siempre brindamos una cotización clara antes de comenzar.",
  },
  {
    id: 3,
    question: "¿Puedo hacer seguimiento del estado de mi reparación?",
    answer: "Sí. Te mantenemos informado durante el proceso y puedes escribirnos para recibir actualizaciones.",
  },
  {
    id: 4,
    question: "¿Ofrecen soporte después de la reparación?",
    answer: "Sí. El repuesto que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. No cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros.",
  },
  {
    id: 5,
    question: "¿Qué hago si no quedo satisfecho con la reparación?",
    answer: "Tu satisfacción es nuestra prioridad. Contáctanos y revisaremos tu caso para ofrecerte una solución adecuada.",
  },
  {
    id: 6,
    question: "¿Es seguro dejar mis datos en el equipo?",
    answer: "Protegemos la privacidad de tu información, aunque recomendamos hacer un respaldo antes de la reparación.",
  },
  {
    id: 7,
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos efectivo, transferencias y otros métodos digitales disponibles.",
  },
  {
    id: 8,
    question: "¿Cuánto demora una reparación?",
    answer: "Depende del servicio: el puerto de carga toma de 1 a 2 horas y el cambio de pantalla de 2 a 3 horas, o en menos de 1 hora si dejas un adelanto. En el resto de servicios, confirmamos el tiempo después del diagnóstico gratuito.",
  },
];

const SobreNosotrosPage = () => {
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setFaqOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Sobre Nosotros | ArmalyTech — Técnicos en Reparación de Celulares Lima</title>
        <meta name="description" content="Conoce al equipo de ArmalyTech. Técnicos especializados en reparación de celulares en Lima con años de experiencia, diagnóstico gratis y garantía en todos los servicios." />
        <link rel="canonical" href="https://www.armalytech.com/sobre-nosotros" />
        <meta property="og:title" content="Sobre Nosotros | ArmalyTech Lima" />
        <meta property="og:description" content="Técnicos especializados en reparación de celulares en Lima. Conoce nuestra misión, proceso y garantía de calidad." />
        <meta property="og:url" content="https://www.armalytech.com/sobre-nosotros" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "¿Ofrecen servicio de reparación por envío para clientes fuera de Lima?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sí. Podemos coordinar reparaciones por envío para clientes fuera de Lima. Escríbenos para indicarte el proceso y las recomendaciones necesarias."
              }
            },
            {
              "@type": "Question",
              "name": "¿Cuánto cuesta una reparación de celular?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "El costo depende del tipo de falla y del modelo del equipo. Siempre brindamos una cotización clara antes de comenzar."
              }
            },
            {
              "@type": "Question",
              "name": "¿Puedo hacer seguimiento del estado de mi reparación?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sí. Te mantenemos informado durante el proceso y puedes escribirnos para recibir actualizaciones."
              }
            },
            {
              "@type": "Question",
              "name": "¿Ofrecen soporte después de la reparación?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sí. El repuesto que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. No cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros."
              }
            },
            {
              "@type": "Question",
              "name": "¿Qué hago si no quedo satisfecho con la reparación?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Tu satisfacción es nuestra prioridad. Contáctanos y revisaremos tu caso para ofrecerte una solución adecuada."
              }
            },
            {
              "@type": "Question",
              "name": "¿Es seguro dejar mis datos en el equipo?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Protegemos la privacidad de tu información, aunque recomendamos hacer un respaldo antes de la reparación."
              }
            },
            {
              "@type": "Question",
              "name": "¿Qué métodos de pago aceptan?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Aceptamos efectivo, transferencias y otros métodos digitales disponibles."
              }
            },
            {
              "@type": "Question",
              "name": "¿Cuánto demora una reparación?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Depende del servicio: el puerto de carga toma de 1 a 2 horas y el cambio de pantalla de 2 a 3 horas, o en menos de 1 hora si dejas un adelanto. En el resto de servicios, confirmamos el tiempo después del diagnóstico gratuito."
              }
            }
          ]
        })}</script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <div className="sobre-nosotros-hero-section">
        <div className="sobre-nosotros-hero">
          <div className="sobre-nosotros-hero__inner">
            <h1 className="sobre-nosotros-hero__title">
              Sobre nosotros
              <span className="sobre-nosotros-hero__title-accent">.</span>
            </h1>
            <nav
              className="sobre-nosotros-hero__breadcrumb"
              aria-label="Breadcrumb"
            >
              <Link to="/">Inicio</Link>
              <span className="sobre-nosotros-hero__breadcrumb-sep">→</span>
              <span className="sobre-nosotros-hero__breadcrumb-current">
                Sobre nosotros
              </span>
            </nav>
          </div>
        </div>
      </div>

      {/* 1) ABOUT US — 2 columnas */}
      <section className="sn-about">
        <div className="sn-about__container">
          <div className="sn-about__left">
            <p className="sn-about__kicker">Sobre nosotros</p>
            <h2 className="sn-about__title">
              Reparamos tus equipos<span className="sn-about__title-dot">.</span>
            </h2>
            <p className="sn-about__subtitle">
              Confía en ArmalyTech — Donde la tecnología se encuentra con lo profesional.
            </p>
            <p className="sn-about__body ">
              En ArmalyTech estamos dedicados a ser tu destino principal para todo lo relacionado con la reparación de celulares en Lima. Con años de experiencia, nuestro equipo de técnicos especializados destaca en diagnosticar y resolver una amplia variedad de problemas que afectan a tus dispositivos.
            </p>
            <div className="sn-about__img-block">
              <img
                src="/aboutus.webp"
                alt="ArmalyTech reparación"
                width={632}
                height={421}
                className="sn-about__img-small"
              />
              
            </div>
            <p className="sn-about__body">
              Entendemos la frustración que genera un dispositivo que no funciona; por eso nos esforzamos en ofrecer soluciones rápidas y confiables para que vuelvas a disfrutar de tus equipos en poco tiempo.
            </p>
          </div>
          <div className="sn-about__right">
            <div className="sn-about__right-img-wrap">
              <img
                src="/howwework.webp"
                alt="Técnico ArmalyTech"
                width={735}
                height={490}
                className="sn-about__right-img"
              />
            </div>
            <p className="sn-about__right-text">
              No somos solo otro servicio de reparación de celulares: somos tus aliados de confianza para mantener tus dispositivos funcionando correctamente. Con años de experiencia sirviendo a la comunidad de Lima, nuestra misión es simple: ofrecer reparaciones de alta calidad y un servicio al cliente excepcional.
            </p>
            <p className="sn-about__right-text">
              Nuestro equipo de técnicos dedicados aporta una amplia experiencia a cada reparación, asegurando que tus dispositivos estén en buenas manos. Desde pantallas rotas hasta daño por agua, problemas de batería o fallos de software, lo hemos visto y reparado todo.
            </p>
          </div>
        </div>
      </section>

      {/* 2) PROCESS — 3 cards */}
      <section className="sn-process">
        <div className="sn-process__container">
          <p className="sn-process__kicker">Proceso</p>
          <h2 className="sn-process__title">
            Revive, restaura, reconecta
            <span className="sn-process__title-dot">.</span>
          </h2>
          <p className="sn-process__subtitle">
            Tres pasos simples para devolver la vida a tu equipo.
          </p>
          <div className="sn-process__grid">
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="sn-process__card">
                <p className="sn-process__card-num">{step.num}</p>
                <h3 className="sn-process__card-title">{step.title}</h3>
                <p className="sn-process__card-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3) TEAM — oscura */}
      <section className="sn-team">
        <div className="sn-team__container">
          <p className="sn-team__kicker">Equipo</p>
          <h2 className="sn-team__title">
            Soluciones rápidas, resultados duraderos
            <span className="sn-team__title-dot">.</span>
          </h2>
          <p className="sn-team__subtitle">
            Nuestro equipo está listo para ayudarte con cualquier reparación.
          </p>
          <div className="sn-team__slider">
            <div className="sn-team__cards">
              {TEAM_MEMBERS.map((member) => (
                <div key={member.name} className="sn-team__card">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    width={80}
                    height={80}
                    className="sn-team__avatar"
                  />
                  <p className="sn-team__name">{member.name}</p>
                  <p className="sn-team__role">{member.role}</p>
                  <div className="sn-team__socials">
                    <a
                      href="https://instagram.com/armalytech"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                    <a
                      href="https://api.whatsapp.com/send/?phone=%2B51924548268"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4) MISSION & VISION — split 50/50 */}
      <section className="sn-mission py-0">
        <div className="sn-mission__img-wrap">
          <img src="/cta.webp" alt="ArmalyTech" width={1920} height={440} className="sn-mission__img" />
        </div>
        <div className="sn-mission__content">
          <div className="sn-mission__content-inner">
          <p className="sn-mission__kicker">MISIÓN Y VISIÓN</p>
          <h2 className="sn-mission__title">
            Los expertos de ArmalyTech están a tu servicio
            <span className="sn-mission__title-dot">.</span>
          </h2>
          <p className="sn-mission__subtitle">
            Reparamos tus dispositivos; eso es lo que hacemos.
          </p>
          <ul className="sn-mission__list">
            <li className="sn-mission__item">
              <span className="sn-mission__bullet" aria-hidden="true" />
              <div>
                <p className="sn-mission__item-title">Misión</p>
                <p className="sn-mission__item-desc">
                  En ArmalyTech, nuestra misión es ser el servicio de reparación de celulares líder en Lima, ofreciendo calidad excepcional y satisfacción al cliente. Nos esforzamos por superar las expectativas con cada reparación, asegurando que los dispositivos de nuestros clientes se restauren a un funcionamiento óptimo de manera rápida y sin problemas.
                </p>
              </div>
            </li>
            <li className="sn-mission__item">
              <span className="sn-mission__bullet" aria-hidden="true" />
              <div>
                <p className="sn-mission__item-title">Visión</p>
                <p className="sn-mission__item-desc">
                  Nuestra visión en ArmalyTech es revolucionar la industria de reparación de celulares estableciendo el estándar de excelencia e innovación. Aspiramos a ser el socio confiable para personas y empresas, brindando soluciones confiables y un servicio personalizado que supere las expectativas.
                </p>
              </div>
            </li>
          </ul>
          <Link to="/precios" className="sn-mission__cta">
            Ver servicios
          </Link>
          </div>
        </div>
      </section>

      {/* 5) FAQ */}
      <section className="sn-faq">
        <div className="sn-faq__container">
          <p className="sn-faq__kicker">FAQ</p>
          <h2 className="sn-faq__title">
            Donde la tecnología se encuentra con la experiencia
            <span className="sn-faq__title-dot">.</span>
          </h2>
          <p className="sn-faq__subtitle">
            Explora las preguntas frecuentes si tienes alguna duda.
          </p>

          <div className="sn-faq__grid">
            {FAQ_ITEMS.map((item, index) => (
              <div key={item.id} className="sn-faq__item">
                <button
                  type="button"
                  className={`sn-faq__question ${faqOpenIndex === index ? "sn-faq__question--open" : ""}`}
                  onClick={() => toggleFaq(index)}
                  aria-expanded={faqOpenIndex === index}
                  aria-controls={`faq-answer-${item.id}`}
                  id={`faq-question-${item.id}`}
                >
                  <span className="sn-faq__question-text">{item.question}</span>
                  <span className="sn-faq__icon" aria-hidden="true">
                    {faqOpenIndex === index ? "−" : "+"}
                  </span>
                </button>
                <div
                  id={`faq-answer-${item.id}`}
                  className={`sn-faq__answer ${faqOpenIndex === index ? "sn-faq__answer--open" : ""}`}
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SobreNosotrosPage;
