import React from 'react'
import ServicePage from './ServicePage.jsx'

const seo = {
  title: 'Reparación de Software de Celular en Lima | ArmalyTech',
  description: 'Solucionamos problemas de software en celulares en Lima. Eliminación de virus, actualización del sistema, optimización de rendimiento. Diagnóstico completamente gratuito en San Borja.',
  canonical: 'https://www.armalytech.com/servicios/problemas-de-software',
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Reparación de Software de Celular",
  "provider": {
    "@type": "ElectronicsRepair",
    "name": "ArmalyTech",
    "url": "https://www.armalytech.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. San Luis 1859 - MultiMercado San Borja",
      "addressLocality": "San Borja",
      "addressRegion": "Lima",
      "postalCode": "15021",
      "addressCountry": "PE"
    },
    "telephone": "+51924548268"
  },
  "areaServed": { "@type": "City", "name": "Lima" },
  "description": "Reparación de problemas de software en celulares en Lima. Virus, actualizaciones, optimización y compatibilidad.",
  "offers": [
    { "@type": "Offer", "name": "Diagnóstico", "price": "0", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Actualización del sistema", "price": "30", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Eliminación de virus y malware", "price": "60", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Comprobación de compatibilidad", "price": "20", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Optimización de rendimiento", "price": "50", "priceCurrency": "PEN" }
  ]
}

const hero = {
  title: 'Problemas de software',
  description: '¿Tu celular va lento, tiene virus o no actualiza? En ArmalyTech diagnosticamos y solucionamos problemas de software en Lima completamente gratis. Optimizamos tu equipo para que funcione como nuevo en nuestro local de San Borja.'
}

const items = [
  { name: 'Diagnóstico', price: 'Gratis', description: 'Evaluamos tu equipo para detectar problemas de software.' },
  { name: 'Actualización del sistema', price: 'S/ 30', description: 'Instalamos las últimas actualizaciones de software.' },
  { name: 'Eliminación de virus y malware', price: 'S/ 60', description: 'Eliminamos software dañino para proteger tu equipo.' },
  { name: 'Comprobación de compatibilidad', price: 'S/ 20', description: 'Verificamos compatibilidad con las últimas apps.' },
  { name: 'Optimización de rendimiento', price: 'S/ 50', description: 'Optimizamos la configuración para un uso más fluido.' },
]

const ProblemasoftwarePage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} />
)

export default ProblemasoftwarePage
