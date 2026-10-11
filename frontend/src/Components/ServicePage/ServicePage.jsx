import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Navbar from '../Navbar/NavBar.jsx'
import Footer from '../Footer.jsx'
import ContactSection from '../ContactSection.jsx'

const WHATSAPP_LINK = 'https://api.whatsapp.com/send/?phone=%2B51924548268'

const linkStyle = { color: '#b8380a', fontWeight: '600', textDecoration: 'underline' }
const paragraphStyle = { color: '#444', lineHeight: '1.75', marginBottom: '1rem' }

// Rich text: a plain string, or an array mixing strings and { to, text } link parts.
const RichText = ({ content }) => {
  if (typeof content === 'string') return content
  return content.map((part, index) =>
    typeof part === 'string' ? (
      <span key={index}>{part}</span>
    ) : (
      <Link key={index} to={part.to} style={linkStyle}>
        {part.text}
      </Link>
    ),
  )
}

// Section content blocks:
//   string            -> paragraph
//   array             -> paragraph with inline links (see RichText)
//   { subheading }    -> h3
//   { list: [...] }   -> bulleted list (items follow the RichText format)
const ContentBlock = ({ block }) => {
  if (block && !Array.isArray(block) && typeof block === 'object') {
    if (block.subheading) {
      return (
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#111', margin: '1.5rem 0 0.5rem' }}>
          {block.subheading}
        </h3>
      )
    }
    if (block.list) {
      return (
        <ul style={{ ...paragraphStyle, paddingLeft: '1.25rem', listStyle: 'disc' }}>
          {block.list.map((item, index) => (
            <li key={index} style={{ marginBottom: '0.5rem' }}>
              <RichText content={item} />
            </li>
          ))}
        </ul>
      )
    }
  }
  return (
    <p style={paragraphStyle}>
      <RichText content={block} />
    </p>
  )
}

// priceNotes: optional [{ lead, text }] shown in a highlighted box right under the price list.
const ServicePage = ({ seo, schema, hero, items, priceNotes = [], sections = [], faqs = [], related = [] }) => {
  const faqSchema = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }
    : null

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <Navbar />

      {/* Hero — mismo estilo que /precios y /contactanos */}
      <div className="pricing-hero-section">
        <div className="pricing-hero">
          <div className="pricing-hero__inner">
            <h1 className="pricing-hero__title">
              {hero.title}<span className="pricing-hero__title-accent">.</span>
            </h1>
            <nav className="pricing-hero__breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Inicio</Link>
              <span className="pricing-hero__breadcrumb-sep">→</span>
              <Link to="/precios">Servicios</Link>
              <span className="pricing-hero__breadcrumb-sep">→</span>
              <span className="pricing-hero__breadcrumb-current">{hero.title}</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Descripción del servicio */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem 1rem' }}>
        <p style={{ fontSize: '1.125rem', color: '#444', lineHeight: '1.75' }}>
          {hero.description}
        </p>
      </section>

      {/* Tabla de precios */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111' }}>
          Precios del servicio
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => (
            <div
              key={item.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '1.25rem 1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                gap: '1rem',
              }}
            >
              <div>
                <p style={{ fontWeight: '600', color: '#111', marginBottom: '4px' }}>{item.name}</p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>{item.description}</p>
              </div>
              <p style={{ fontWeight: '700', color: '#111', whiteSpace: 'nowrap', fontSize: '1.1rem' }}>
                {item.price}
              </p>
            </div>
          ))}
        </div>
        {priceNotes.length > 0 && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem 1.25rem',
              background: '#fdf3ef',
              border: '1px solid #f1d2c6',
              borderRadius: '12px',
            }}
          >
            {priceNotes.map((note) => (
              <p key={note.lead} style={{ color: '#444', lineHeight: '1.65', fontSize: '0.95rem' }}>
                <strong style={{ color: '#b8380a' }}>{note.lead}</strong> {note.text}
              </p>
            ))}
          </div>
        )}
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem', lineHeight: '1.6' }}>
          Son precios de referencia. El valor final depende del modelo de tu equipo y se confirma en el presupuesto
          que recibes después del diagnóstico gratuito. Consulta la{' '}
          <Link to="/precios" style={linkStyle}>lista completa de precios</Link>.
        </p>
      </section>

      {/* Contenido informativo del servicio */}
      {sections.length > 0 && (
        <article style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem 2rem' }}>
          {sections.map((section) => (
            <section key={section.heading} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#111' }}>
                {section.heading}
              </h2>
              {section.content.map((block, index) => (
                <ContentBlock key={index} block={block} />
              ))}
            </section>
          ))}
        </article>
      )}

      {/* Preguntas frecuentes (el JSON-LD FAQPage usa exactamente este texto) */}
      {faqs.length > 0 && (
        <section style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#111' }}>
            Preguntas frecuentes
          </h2>
          {faqs.map((faq) => (
            <div key={faq.question} style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111', marginBottom: '0.35rem' }}>
                {faq.question}
              </h3>
              <p style={{ color: '#444', lineHeight: '1.75' }}>{faq.answer}</p>
            </div>
          ))}
        </section>
      )}

      {/* Enlaces internos y CTA */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#111' }}>
          Más información
        </h2>
        <ul style={{ ...paragraphStyle, paddingLeft: '1.25rem', listStyle: 'disc' }}>
          {related.map((link) => (
            <li key={link.to} style={{ marginBottom: '0.5rem' }}>
              <Link to={link.to} style={linkStyle}>{link.text}</Link>
              {link.note ? `: ${link.note}` : ''}
            </li>
          ))}
          <li style={{ marginBottom: '0.5rem' }}>
            <Link to="/precios" style={linkStyle}>Precios de reparación de celulares</Link>: todos los servicios con su valor de referencia.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link to="/garantia" style={linkStyle}>Garantía de reparación</Link>: qué cubre, qué no cubre y cómo hacer un reclamo.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link to="/contactanos" style={linkStyle}>Contacto y términos de servicio</Link>: dirección, horario y teléfono.
          </li>
        </ul>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: '#555', marginBottom: '1rem' }}>
            ¿Tienes dudas sobre tu equipo? El diagnóstico es gratuito.
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              backgroundColor: '#111',
              color: '#fff',
              padding: '0.875rem 2rem',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '1rem',
            }}
          >
            Consultar por WhatsApp
          </a>
        </div>
      </section>

      <ContactSection />
      <Footer />
    </div>
  )
}

export default ServicePage
