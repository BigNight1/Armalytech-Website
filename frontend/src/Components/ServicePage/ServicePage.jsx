import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Navbar from '../Navbar/NavBar.jsx'
import Footer from '../Footer.jsx'
import ContactSection from '../ContactSection.jsx'

const ServicePage = ({ seo, schema, hero, items }) => {
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
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>
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

        {/* CTA */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: '#555', marginBottom: '1rem' }}>
            ¿Tienes dudas sobre tu equipo? El diagnóstico es gratuito.
          </p>
          <a
            href="https://api.whatsapp.com/send/?phone=%2B51924548268"
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
