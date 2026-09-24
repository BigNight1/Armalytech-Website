import ServicePage from './ServicePage.jsx'

const seo = {
  title: 'Reparación de Puerto de Carga de Celular en Lima | ArmalyTech',
  description: 'Reparamos el puerto de carga de tu celular en Lima desde S/ 38. Limpieza, cambio de puerto, reparación por humedad y adaptación a USB-C. San Borja.',
  canonical: 'https://www.armalytech.com/servicios/reparacion-puerto-de-carga',
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Reparación de Puerto de Carga de Celular",
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
  "description": "Reparación de puerto de carga de celulares en Lima. Limpieza, cambio de puerto, reparación por humedad y retrofit a USB-C.",
  "offers": [
    { "@type": "Offer", "name": "Limpieza de puerto de carga", "price": "38", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Cambio de puerto", "price": "85", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Actualización a carga rápida", "price": "69", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Reparación por humedad", "price": "77", "priceCurrency": "PEN" },
    { "@type": "Offer", "name": "Retrofit a USB-C", "price": "159", "priceCurrency": "PEN" }
  ]
}

const hero = {
  title: 'Reparación de puerto de carga',
  description: '¿Tu celular no carga correctamente? En ArmalyTech limpiamos y reparamos puertos de carga en Lima. Desde una limpieza simple hasta el cambio completo del conector, lo resolvemos en nuestro local de San Borja.'
}

const items = [
  { name: 'Limpieza de puerto de carga', price: 'S/ 38', description: 'Eliminamos residuos para una carga óptima.' },
  { name: 'Cambio de puerto', price: 'S/ 85', description: 'Instalamos un puerto nuevo para carga estable.' },
  { name: 'Actualización a carga rápida', price: 'S/ 69', description: 'Mejora a carga más rápida.' },
  { name: 'Reparación por humedad', price: 'S/ 77', description: 'Recuperamos el puerto después de daño por agua.' },
  { name: 'Retrofit a USB-C', price: 'S/ 159', description: 'Adaptamos equipos antiguos a puerto USB-C.' },
]

const ReparacionPuertoCargaPage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} />
)

export default ReparacionPuertoCargaPage
