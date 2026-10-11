import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "../Navbar/NavBar.jsx";
import Footer from "../Footer.jsx";
import "../pricing-hero.css";
import "../ContactPage/contact-page.css";

const PHONE = "+51 924 548 268";
const PHONE_LINK = "tel:+51924548268";
const WHATSAPP_LINK = "https://wa.me/51924548268";
const ADDRESS = "Av. San Luis 1873, Tienda 127, San Borja 15021 - MultiMercado San Borja, Lima, Perú";
const HORARIO = "Lun–Sáb 10:00 – 20:00";

const COVERED = [
  {
    label: "Fallas que aparecen solas",
    desc: "Cubrimos las fallas que surgen sin una causa externa, por ejemplo cuando el componente que reparamos o el repuesto que instalamos deja de funcionar \"de la nada\".",
  },
  {
    label: "Repuesto cambiado",
    desc: "El repuesto que cambiamos tiene 3 meses de garantía. Si la pieza falla por sí sola durante ese plazo, trae tu equipo y lo revisamos.",
  },
];

const NOT_COVERED = [
  {
    label: "Golpes y caídas",
    desc: "Equipo roto, golpeado o caído.",
  },
  {
    label: "Agua y otros líquidos",
    desc: "Daños por contacto con agua o cualquier otro líquido.",
  },
  {
    label: "Mal uso o terceros",
    desc: "Fallas causadas por mal uso o por manipulación del equipo por parte de terceros.",
  },
];

const TERMS = [
  {
    label: "3 meses sobre el repuesto",
    desc: "La garantía dura 3 meses desde la entrega y se aplica al repuesto que cambiamos, siempre que la pieza falle por sí sola.",
  },
  {
    label: "Servicios de software y daño por agua",
    desc: "En estos servicios la garantía de 3 meses se aplica a las piezas que cambiemos durante el trabajo.",
  },
];

const CLAIM_STEPS = [
  {
    label: "Paso 1",
    desc: "Reúne tu comprobante o el número de ticket de la reparación.",
  },
  {
    label: "Paso 2",
    desc: "Trae tu equipo a la tienda o escríbenos primero por WhatsApp al +51 924 548 268 para contarnos qué ocurre.",
  },
  {
    label: "Paso 3",
    desc: "Revisamos tu equipo y te indicamos si la falla está cubierta por la garantía y cómo procedemos.",
  },
];

const FAQS = [
  {
    question: "¿La garantía cubre una pantalla que se rompió después de la entrega?",
    answer: "No. La garantía no cubre equipos rotos, golpeados o caídos.",
  },
  {
    question: "¿Y si mi celular se mojó después de la reparación?",
    answer: "Tampoco. El contacto con agua u otros líquidos queda fuera de la garantía. Si ya se mojó, escríbenos y evaluamos el caso.",
  },
  {
    question: "¿Qué pasa si otra persona abrió o manipuló mi equipo?",
    answer: "La garantía no cubre fallas causadas por mal uso o por manipulación de terceros, porque no podemos asegurar el estado en que quedó el equipo.",
  },
  {
    question: "¿Cuánto tiempo tengo para reclamar?",
    answer: "El repuesto que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola.",
  },
  {
    question: "¿Necesito algún documento para hacer valer la garantía?",
    answer: "Trae tu comprobante o el número de ticket de la reparación para que podamos ubicar tu servicio con rapidez.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

function TermsList({ items }) {
  return (
    <ul className="contact-info__terms-list">
      {items.map((item) => (
        <li key={item.label} className="contact-info__terms-item">
          <span className="contact-info__bullet" aria-hidden="true" />
          <span className="contact-info__terms-item-text">
            <strong>{item.label}:</strong> <span className="contact-info__terms-item-desc">{item.desc}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function FaqList({ items }) {
  return (
    <ul className="contact-info__terms-list">
      {items.map((item) => (
        <li key={item.question} className="contact-info__terms-item">
          <span className="contact-info__bullet" aria-hidden="true" />
          <span className="contact-info__terms-item-text">
            <strong>{item.question}</strong> <span className="contact-info__terms-item-desc">{item.answer}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const WarrantyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Garantía de reparación | ArmalyTech San Borja</title>
        <meta
          name="description"
          content="Qué cubre y qué no cubre la garantía de ArmalyTech: 3 meses de garantía sobre el repuesto cambiado cuando la pieza falla por sí sola. Cómo hacer un reclamo."
        />
        <link rel="canonical" href="https://www.armalytech.com/garantia" />
        <meta property="og:title" content="Garantía de reparación | ArmalyTech San Borja" />
        <meta
          property="og:description"
          content="Qué cubre y qué no cubre la garantía de ArmalyTech: 3 meses de garantía sobre el repuesto cambiado cuando la pieza falla por sí sola."
        />
        <meta property="og:url" content="https://www.armalytech.com/garantia" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(FAQ_JSON_LD)}</script>
      </Helmet>
      <Navbar />

      <div className="contact-hero-section">
        <div className="contact-hero">
          <div className="contact-hero__inner">
            <h1 className="contact-hero__title">
              Garantía<span className="contact-hero__title-accent">.</span>
            </h1>
            <nav className="contact-hero__breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Inicio</Link>
              <span className="contact-hero__breadcrumb-sep">→</span>
              <span className="contact-hero__breadcrumb-current">Garantía</span>
            </nav>
          </div>
        </div>
      </div>

      <section className="contact-info">
        <div className="contact-info__container">
          <div className="contact-info__col">
            <div className="contact-info__header">
              <p className="contact-info__kicker">GARANTÍA</p>
              <h2 className="contact-info__title">
                Garantía de reparación<span className="contact-info__title-dot">.</span>
              </h2>
              <p className="contact-info__desc">
                Respaldamos nuestras reparaciones. Aquí te explicamos con claridad qué cubre la garantía, qué queda
                fuera de ella, por cuánto tiempo y cómo hacer un reclamo.
              </p>
            </div>

            <h3 className="contact-info__subtitle">Qué cubre la garantía</h3>
            <TermsList items={COVERED} />

            <h3 className="contact-info__subtitle contact-info__subtitle--spaced">Qué no cubre la garantía</h3>
            <TermsList items={NOT_COVERED} />
          </div>

          <div className="contact-info__col">
            <h3 className="contact-info__subtitle">Plazos</h3>
            <TermsList items={TERMS} />

            <h3 className="contact-info__subtitle contact-info__subtitle--spaced">Cómo hacer un reclamo</h3>
            <TermsList items={CLAIM_STEPS} />

            <h3 className="contact-info__subtitle contact-info__subtitle--spaced">Preguntas frecuentes</h3>
            <FaqList items={FAQS} />
          </div>
        </div>

        <div className="contact-info__footer">
          <p className="contact-info__closing">
            Si tienes dudas sobre si tu caso está cubierto, escríbenos antes de venir y te orientamos. Toda
            reparación comienza con un diagnóstico gratuito y un presupuesto claro antes de iniciar el trabajo. Para
            conocer el resto de nuestros términos de servicio visita la página de{" "}
            <Link to="/contactanos" className="font-semibold text-[#ff5a2a] hover:underline">contacto</Link>.
          </p>
          <p className="contact-info__contact-line">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">WhatsApp</a> ·{" "}
            <a href={PHONE_LINK}>{PHONE}</a> · {ADDRESS} · {HORARIO}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WarrantyPage;
