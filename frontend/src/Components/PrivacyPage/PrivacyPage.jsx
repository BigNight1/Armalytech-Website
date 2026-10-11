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
const LAST_UPDATED = "6 de octubre de 2026";

const DATA_COLLECTED = [
  {
    label: "Registro en ArmalyTech Club",
    desc: "Nombre, apellido, número de WhatsApp y tu decisión de recibir o no promociones. Los registramos cuando te unes desde el código QR/NFC de la tienda.",
  },
  {
    label: "Tickets de servicio técnico",
    desc: "Nombre, número de celular, datos del equipo (marca, modelo, IMEI o serie), falla reportada, estado de ingreso, repuestos, precios, pagos y notas de la reparación.",
  },
  {
    label: "Clave o patrón del equipo",
    desc: "Solo si nos la entregas para probar la reparación. Se guarda cifrada, solo el personal autorizado puede verla y se elimina automáticamente al entregar o cancelar el ticket.",
  },
  {
    label: "Mensajes de WhatsApp",
    desc: "El contenido de los mensajes que nos envías, la fecha y hora del último mensaje y el estado de entrega de los mensajes que te enviamos.",
  },
];

const PURPOSES = [
  {
    label: "Prestar el servicio",
    desc: "Registrar, reparar y entregar tu equipo, informarte su estado y emitir comprobantes.",
  },
  {
    label: "Avisos sobre tu equipo",
    desc: "Enviarte por WhatsApp el aviso de equipo listo, el enlace de seguimiento y responder tus consultas, incluido nuestro asistente automático.",
  },
  {
    label: "Programa de fidelización",
    desc: "Registrar tus visitas y aplicar los beneficios de ArmalyTech Club.",
  },
  {
    label: "Promociones y reseñas",
    desc: "Solo si lo aceptaste: enviarte promociones y pedirte tu opinión. Puedes darte de baja en cualquier momento respondiendo \"BAJA\" o tocando \"Dejar de recibir promociones\".",
  },
  {
    label: "Garantía y obligaciones legales",
    desc: "Atender reclamos de garantía y cumplir obligaciones contables y tributarias.",
  },
];

const THIRD_PARTIES = [
  {
    label: "Meta Platforms (WhatsApp)",
    desc: "Para enviar y recibir mensajes de WhatsApp a través de la API oficial de WhatsApp Business.",
  },
  {
    label: "Proveedores de infraestructura",
    desc: "Servidores y base de datos donde se aloja nuestro sistema. Las respuestas automáticas se generan en nuestro propio servidor.",
  },
  {
    label: "Sin venta de datos",
    desc: "No vendemos ni alquilamos tus datos personales a terceros.",
  },
];

const RETENTION = [
  {
    label: "Datos de clientes y tickets",
    desc: "Mientras seas cliente y durante el plazo de garantía de la reparación; después, solo el tiempo que exijan las normas contables y tributarias.",
  },
  {
    label: "Clave del equipo",
    desc: "Se elimina al entregar o cancelar el ticket.",
  },
  {
    label: "Promociones",
    desc: "Hasta que te des de baja.",
  },
];

const DELETION_STEPS = [
  {
    label: "Paso 1",
    desc: "Escríbenos por WhatsApp al +51 924 548 268 con el texto \"ELIMINAR MIS DATOS\", o acércate a la tienda.",
  },
  {
    label: "Paso 2",
    desc: "Confirmaremos tu identidad con el número de celular registrado.",
  },
  {
    label: "Paso 3",
    desc: "Eliminaremos tus datos personales dentro del plazo que establece la ley y te confirmaremos por el mismo medio. Solo conservaremos lo que la ley nos obligue a guardar (por ejemplo, comprobantes de pago).",
  },
];

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

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Política de Privacidad | ArmalyTech</title>
        <meta
          name="description"
          content="Cómo ArmalyTech recopila, usa y protege tus datos personales, y cómo solicitar su eliminación."
        />
        <link rel="canonical" href="https://www.armalytech.com/privacidad" />
        <meta property="og:title" content="Política de Privacidad | ArmalyTech" />
        <meta property="og:url" content="https://www.armalytech.com/privacidad" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />

      <div className="contact-hero-section">
        <div className="contact-hero">
          <div className="contact-hero__inner">
            <h1 className="contact-hero__title">
              Privacidad<span className="contact-hero__title-accent">.</span>
            </h1>
            <nav className="contact-hero__breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Inicio</Link>
              <span className="contact-hero__breadcrumb-sep">→</span>
              <span className="contact-hero__breadcrumb-current">Política de Privacidad</span>
            </nav>
          </div>
        </div>
      </div>

      <section className="contact-info">
        <div className="contact-info__container">
          <div className="contact-info__col">
            <div className="contact-info__header">
              <p className="contact-info__kicker">PRIVACIDAD</p>
              <h2 className="contact-info__title">
                Política de Privacidad<span className="contact-info__title-dot">.</span>
              </h2>
              <p className="contact-info__desc">
                En ArmalyTech cuidamos tus datos personales conforme a la Ley N.° 29733, Ley de Protección de Datos
                Personales del Perú, y su reglamento. Aquí te explicamos qué datos guardamos, para qué y cómo puedes
                pedir que los eliminemos. Última actualización: {LAST_UPDATED}.
              </p>
            </div>

            <h3 className="contact-info__subtitle">Qué datos recopilamos</h3>
            <TermsList items={DATA_COLLECTED} />

            <h3 className="contact-info__subtitle contact-info__subtitle--spaced">Para qué los usamos</h3>
            <TermsList items={PURPOSES} />
          </div>

          <div className="contact-info__col">
            <h3 className="contact-info__subtitle">Con quién los compartimos</h3>
            <TermsList items={THIRD_PARTIES} />

            <h3 className="contact-info__subtitle contact-info__subtitle--spaced">Cuánto tiempo los guardamos</h3>
            <TermsList items={RETENTION} />

            <h3 id="eliminacion-de-datos" className="contact-info__subtitle contact-info__subtitle--spaced">
              Cómo eliminar tus datos
            </h3>
            <TermsList items={DELETION_STEPS} />
          </div>
        </div>

        <div className="contact-info__footer">
          <p className="contact-info__closing">
            También puedes pedirnos acceder a tus datos, corregirlos u oponerte a su uso (derechos ARCO) por los mismos
            medios. Si consideras que no atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de
            Datos Personales del Ministerio de Justicia y Derechos Humanos. Podemos actualizar esta política; la versión
            vigente siempre estará publicada en esta página.
          </p>
          <p className="contact-info__contact-line">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">WhatsApp</a> ·{" "}
            <a href={PHONE_LINK}>{PHONE}</a> · {ADDRESS}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
