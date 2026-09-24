import React from 'react'
import ServicePage from './ServicePage.jsx'

const seo = {
  title: 'Reparación por Daño de Agua en Celulares Lima | ArmalyTech',
  description: 'Restauramos celulares dañados por agua en Lima desde S/ 47. Secado, deshumidificación, tratamiento de corrosión y recuperación de datos. Diagnóstico gratis en San Borja.',
  canonical: 'https://www.armalytech.com/servicios/restauracion-dano-de-agua',
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Restauración por Daño de Agua en Celulares",
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
  "description": "Restauración de celulares dañados por agua en Lima. Secado, deshumidificación, tratamiento de corrosión y recuperación de datos.",
  "offers": [
    { "@type": "Offer", "name": "Reparación de parlante y micrófono", "price": "85", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Secado y deshumidificación", "price": "88", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Reparación de botones", "price": "69", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Tratamiento de corrosión", "price": "47", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Recuperación de datos", "price": "159", "priceCurrency": "PEN" }
  ]
}

const hero = {
  title: 'Restauración por daño de agua',
  description: '¿Tu celular se cayó al agua? ¡Apágalo de inmediato y no lo conectes al cargador! Tráelo rápido a ArmalyTech en San Borja, Lima. Realizamos un secado profesional, tratamiento químico contra la corrosión y recuperación de datos para darte la mayor probabilidad de salvar tu equipo.'
}

const items = [
  { name: 'Reparación de parlante y micrófono', price: 'S/ 85', description: 'Reparamos o reemplazamos componentes dañados por agua.' },
  { name: 'Secado y deshumidificación', price: 'S/ 88', description: 'Eliminamos la humedad para evitar más daños.' },
  { name: 'Reparación de botones', price: 'S/ 69', description: 'Reparamos o reemplazamos botones dañados.' },
  { name: 'Tratamiento de corrosión', price: 'S/ 47', description: 'Tratamos la corrosión para evitar fallas futuras.' },
  { name: 'Recuperación de datos', price: 'S/ 159', description: 'Recuperamos datos de equipos dañados por agua.' },
]

const RestauracionDanoAguaPage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} />
)

export default RestauracionDanoAguaPage
