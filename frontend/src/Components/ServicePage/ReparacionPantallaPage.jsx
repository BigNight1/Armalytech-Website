import React from 'react'
import ServicePage from './ServicePage.jsx'

const seo = {
  title: 'Reparación de Pantalla de Celular en Lima | ArmalyTech',
  description: 'Cambiamos pantallas OLED, digitizer y cristal de celulares en Lima desde S/ 69. Diagnóstico gratuito, repuestos de calidad y garantía. Visítanos en San Borja.',
  canonical: 'https://www.armalytech.com/servicios/reparacion-de-pantalla',
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Reparación de Pantalla de Celular",
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
  "description": "Servicio de reparación y cambio de pantalla de celulares en Lima. Incluye pantallas OLED, digitizer y cristal completo.",
  "offers": [
    { "@type": "Offer", "name": "Cambio de pantalla OLED", "price": "185", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Cambio de digitizer", "price": "138", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Cambio de cristal completo", "price": "69", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Calibración de sensibilidad", "price": "47", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Restauración multitáctil", "price": "59", "priceCurrency": "PEN" }
  ]
}

const hero = {
  title: 'Reparación de pantalla',
  description: 'Reparamos y reemplazamos pantallas de celulares en Lima con repuestos de alta calidad. Desde cristales rotos hasta pantallas OLED, nuestros técnicos en San Borja lo resuelven el mismo día en la mayoría de casos. Diagnóstico completamente gratuito.'
}

const items = [
  { name: 'Cambio de pantalla OLED', price: 'S/ 185', description: 'Pantalla OLED nueva con nuestro servicio de reemplazo.' },
  { name: 'Cambio de digitizer', price: 'S/ 138', description: 'Recupera la respuesta táctil con reemplazos precisos.' },
  { name: 'Cambio de cristal completo', price: 'S/ 69', description: '¿Pantalla rota? Reemplazo completo de cristal.' },
  { name: 'Calibración de sensibilidad', price: 'S/ 47', description: 'Optimizamos la sensibilidad táctil de tu pantalla.' },
  { name: 'Restauración multitáctil', price: 'S/ 59', description: 'Recupera la función multitáctil con nuestro servicio.' },
]

const ReparacionPantallaPage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} />
)

export default ReparacionPantallaPage
