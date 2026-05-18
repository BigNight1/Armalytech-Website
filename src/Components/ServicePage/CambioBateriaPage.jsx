import React from 'react'
import ServicePage from './ServicePage.jsx'

const seo = {
  title: 'Cambio de Batería de Celular en Lima | ArmalyTech',
  description: 'Cambiamos la batería de tu celular en Lima desde S/ 97 con batería original OEM. Servicio el mismo día disponible. Diagnóstico gratuito en San Borja.',
  canonical: 'https://www.armalytech.com/servicios/cambio-de-bateria',
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Cambio de Batería de Celular",
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
  "description": "Servicio de cambio de batería de celulares en Lima. Baterías estándar, originales OEM y servicio el mismo día disponible.",
  "offers": [
    { "@type": "Offer", "name": "Cambio de batería estándar", "price": "125", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Optimización de energía", "price": "38", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Instalación de carga rápida", "price": "69", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Batería original (OEM)", "price": "97", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Cambio de batería el mismo día", "price": "159", "priceCurrency": "PEN" }
  ]
}

const hero = {
  title: 'Cambio de batería',
  description: 'Devuelve la vida a tu celular con un cambio de batería profesional en Lima. Trabajamos con baterías originales OEM y estándar de alta calidad. Servicio el mismo día disponible en nuestro local de San Borja.'
}

const items = [
  { name: 'Cambio de batería estándar', price: 'S/ 125', description: 'Nueva batería para mejorar el rendimiento de tu equipo.' },
  { name: 'Optimización de energía', price: 'S/ 38', description: 'Alarga la vida de tu batería con un manejo eficiente.' },
  { name: 'Instalación de carga rápida', price: 'S/ 69', description: 'Actualiza a carga rápida.' },
  { name: 'Batería original (OEM)', price: 'S/ 97', description: 'Batería del fabricante original.' },
  { name: 'Cambio de batería el mismo día', price: 'S/ 159', description: 'Servicio rápido para que no te quedes sin equipo.' },
]

const CambioBateriaPage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} />
)

export default CambioBateriaPage
