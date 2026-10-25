import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Navbar from '../Navbar/NavBar.jsx'
import Footer from '../Footer.jsx'
import '../pricing-hero.css'
import '../ContactPage/contact-page.css'
import { pricingFor } from '../../data/pricingData.js'

const CANONICAL = 'https://www.armalytech.com/reparacion-de-celulares-san-borja'
const TITLE = 'Reparación de celulares en San Borja | ArmalyTech'
const DESCRIPTION =
  'Taller de reparación de celulares en San Borja, Lima. Av. San Luis 1849-1851, Tienda 127, MultiMercado San Borja. Lun–Sáb 10:00–20:00. Diagnóstico gratuito.'

const PHONE = '+51 924 548 268'
const PHONE_LINK = 'tel:+51924548268'
const WHATSAPP_LINK = 'https://api.whatsapp.com/send/?phone=%2B51924548268'
const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d289.9719361859796!2d-76.99659845096025!3d-12.085994834346701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c766de68b979%3A0x2e06fa302ff6b50!2sArmalytech!5e0!3m2!1ses-419!2spe!4v1731759574355!5m2!1ses-419!2spe'

const linkStyle = { color: '#b8380a', fontWeight: '600', textDecoration: 'underline' }
const paragraphStyle = { color: '#444', lineHeight: '1.75', marginBottom: '1rem' }
const headingStyle = { fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#111' }
const sectionStyle = { marginBottom: '2.25rem' }

// Todos los montos salen de data/pricingData.js
const screen = pricingFor('reparacion-pantalla')
const battery = pricingFor('cambio-bateria')
const port = pricingFor('puerto-carga')
const water = pricingFor('danio-agua')

const SERVICES = [
  {
    to: '/servicios/reparacion-de-pantalla',
    text: 'Reparación de pantalla',
    desc: `cristal roto, imagen con líneas o manchas y táctil que no responde. Desde ${screen.desde} (${screen.price('oled')} según el modelo).`,
  },
  {
    to: '/servicios/cambio-de-bateria',
    text: 'Cambio de batería',
    desc: `el celular dura poco, se apaga solo o la batería está hinchada. Desde ${battery.desde} (${battery.price('estandar')} según el modelo).`,
  },
  {
    to: '/servicios/reparacion-puerto-de-carga',
    text: 'Reparación de puerto de carga',
    desc: `carga lenta, intermitente o cable que queda flojo. Desde ${port.desde}.`,
  },
  {
    to: '/servicios/restauracion-dano-de-agua',
    text: 'Restauración por daño de agua',
    desc: `equipos que se mojaron o muestran señales de humedad. Desde ${water.desde}.`,
  },
  {
    to: '/servicios/problemas-de-software',
    text: 'Problemas de software',
    desc: 'lentitud, virus, aplicaciones que fallan o actualizaciones que no terminan. Diagnóstico gratis.',
  },
]

const VISIT_STEPS = [
  'Llegas a la tienda o nos escribes por WhatsApp para contarnos qué le pasa a tu celular.',
  'Hacemos el diagnóstico gratuito, por WhatsApp o en tienda, y te explicamos qué encontramos.',
  'Recibes el presupuesto con el precio final antes de que empiece cualquier trabajo.',
  'Tú decides si aprobamos la reparación. No iniciamos nada sin tu aprobación.',
]

const FAQS = [
  {
    question: '¿Dónde queda ArmalyTech en San Borja?',
    answer:
      'Estamos en Av. San Luis 1849-1851, Tienda 127, dentro del MultiMercado San Borja, en el distrito de San Borja, Lima.',
  },
  {
    question: '¿Cuál es el horario de atención?',
    answer:
      'Atendemos de lunes a sábado de 10:00 a 20:00. Puedes escribirnos por WhatsApp o llamar al +51 924 548 268 para consultar antes de venir.',
  },
  {
    question: '¿Puedo ir desde Surquillo, San Luis, Santiago de Surco o La Victoria?',
    answer:
      'Sí. La tienda recibe a personas de San Borja y de distritos cercanos como Surquillo, San Luis, Santiago de Surco y La Victoria que prefieren llevar su equipo para el diagnóstico.',
  },
  {
    question: '¿El diagnóstico tiene costo?',
    answer:
      'No. El diagnóstico es gratuito, por WhatsApp o en tienda, y después de él recibes el presupuesto con el precio final antes de que se inicie cualquier trabajo.',
  },
  {
    question: '¿Qué cubre la garantía de las reparaciones?',
    answer:
      'El repuesto que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. No cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros.',
  },
]

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
}

const SanBorjaPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(FAQ_JSON_LD)}</script>
      </Helmet>

      <Navbar />

      <div className="contact-hero-section">
        <div className="contact-hero">
          <div className="contact-hero__inner">
            <h1 className="contact-hero__title">
              Reparación de celulares en San Borja<span className="contact-hero__title-accent">.</span>
            </h1>
            <nav className="contact-hero__breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Inicio</Link>
              <span className="contact-hero__breadcrumb-sep">→</span>
              <span className="contact-hero__breadcrumb-current">Reparación en San Borja</span>
            </nav>
          </div>
        </div>
      </div>

      <article style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
        <p style={{ fontSize: '1.125rem', color: '#444', lineHeight: '1.75', marginBottom: '2rem' }}>
          ArmalyTech es un taller de reparación de celulares con tienda física en San Borja, Lima. Estamos dentro
          del MultiMercado San Borja, sobre la Av. San Luis, y atendemos de lunes a sábado. Aquí encuentras cómo
          ubicarnos, qué reparamos y cómo es una visita, de principio a fin.
        </p>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Dónde estamos</h2>
          <ul style={{ ...paragraphStyle, paddingLeft: '1.25rem', listStyle: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Dirección:</strong> Av. San Luis 1849-1851, Tienda 127, San Borja 15021, Lima.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Referencia:</strong> dentro del MultiMercado San Borja.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Horario:</strong> lunes a sábado, de 10:00 a 20:00.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Teléfono y WhatsApp:</strong> <a href={PHONE_LINK} style={linkStyle}>{PHONE}</a>.
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Cómo llegar a la tienda</h2>
          <p style={paragraphStyle}>
            Busca el MultiMercado San Borja sobre la Av. San Luis, en el número 1849-1851, y ubica la Tienda 127 en su
            interior. El mapa al final de esta página te muestra el punto exacto. Si prefieres confirmar la
            ubicación antes de salir, escríbenos por{' '}
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={linkStyle}>WhatsApp</a>.
          </p>
          <p style={paragraphStyle}>
            Recibimos a personas del distrito y también de zonas cercanas, como Surquillo, San Luis, Santiago de
            Surco y La Victoria, que prefieren llevar su equipo a una tienda para que lo revisen en persona. Si
            tienes dudas sobre tu caso, puedes describirnos la falla por mensaje antes de venir.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Qué reparamos</h2>
          <p style={paragraphStyle}>
            Cada servicio tiene su propia página con síntomas, opciones y precios de referencia:
          </p>
          <ul style={{ ...paragraphStyle, paddingLeft: '1.25rem', listStyle: 'disc' }}>
            {SERVICES.map((service) => (
              <li key={service.to} style={{ marginBottom: '0.5rem' }}>
                <Link to={service.to} style={linkStyle}>{service.text}</Link>: {service.desc}
              </li>
            ))}
          </ul>
          <p style={paragraphStyle}>
            Los valores son de referencia y dependen del modelo de tu equipo. Puedes verlos todos juntos en la página
            de{' '}
            <Link to="/precios" style={linkStyle}>precios de reparación de celulares</Link>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Cómo es una visita</h2>
          <ol style={{ ...paragraphStyle, paddingLeft: '1.25rem', listStyle: 'decimal' }}>
            {VISIT_STEPS.map((step) => (
              <li key={step} style={{ marginBottom: '0.5rem' }}>{step}</li>
            ))}
          </ol>
          <p style={paragraphStyle}>
            Para aprovechar mejor el diagnóstico, haz una copia de seguridad si el equipo todavía funciona y piensa
            en qué momento empezó la falla y qué pasó antes: una caída, un líquido o una actualización. Si el
            problema es de carga, trae también el cable y el cargador que usas.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Garantía de las reparaciones</h2>
          <p style={paragraphStyle}>
            El repuesto que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. La
            garantía no cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o
            manipulación por terceros. Las condiciones completas están en la página de{' '}
            <Link to="/garantia" style={linkStyle}>garantía de reparación</Link>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Preguntas frecuentes</h2>
          {FAQS.map((faq) => (
            <div key={faq.question} style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111', marginBottom: '0.35rem' }}>
                {faq.question}
              </h3>
              <p style={{ color: '#444', lineHeight: '1.75' }}>{faq.answer}</p>
            </div>
          ))}
        </section>

        <p style={{ ...paragraphStyle, textAlign: 'center' }}>
          ¿Prefieres otra vía de contacto? Visita la página de{' '}
          <Link to="/contactanos" style={linkStyle}>contacto</Link> o escríbenos por WhatsApp.
        </p>
      </article>

      {/* Google Maps — mismo embed que /contactanos */}
      <iframe
        className="contact-map"
        title="Mapa de ArmalyTech en San Borja"
        src={MAP_SRC}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <Footer />
    </div>
  )
}

export default SanBorjaPage
