import ServicePage from './ServicePage.jsx'
import { pricingFor } from '../../data/pricingData.js'

// Todos los montos salen de data/pricingData.js
const pricing = pricingFor('reparacion-pantalla')

const seo = {
  title: 'Cambio de Pantalla de Celular en Lima en 2–3 Horas',
  description: `Cambiamos la pantalla de tu celular en San Borja en 2 a 3 horas, desde ${pricing.desde} (hasta ${pricing.high('oled')} según el modelo). Diagnóstico gratis y 3 meses de garantía.`,
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
      "streetAddress": "Av. San Luis 1873, Tienda 127 - MultiMercado San Borja",
      "addressLocality": "San Borja",
      "addressRegion": "Lima",
      "postalCode": "15021",
      "addressCountry": "PE"
    },
    "telephone": "+51924548268"
  },
  "areaServed": { "@type": "City", "name": "Lima" },
  "description": "Servicio de reparación y cambio de pantalla de celulares en Lima. Incluye pantallas OLED, digitizer y cristal completo.",
  "offers": pricing.offers
}

const hero = {
  title: 'Reparación de pantalla',
  description: 'Reparamos y reemplazamos pantallas de celulares en Lima con repuestos de alta calidad. Desde cristales rotos hasta pantallas OLED, nuestros técnicos en San Borja la cambian en 2 a 3 horas. Si dejas un adelanto, traemos el repuesto antes y la instalación toma menos de 1 hora. Diagnóstico gratuito.'
}

const items = pricing.items

const priceNotes = [
  {
    lead: '¿Lo necesitas el mismo día?',
    text: 'Deja un adelanto de la mitad del costo del repuesto, lo traemos del almacén y, cuando llega, instalamos tu repuesto nuevo en menos de 1 hora.',
  },
]

const sections = [
  {
    heading: 'Señales de que tu pantalla necesita reparación',
    content: [
      'No todos los daños se ven como un vidrio roto. Estas son las señales más comunes de que la pantalla de tu celular necesita una revisión:',
      {
        list: [
          'Grietas o astillas en el vidrio, aunque la imagen se vea bien.',
          'Líneas verticales u horizontales de colores que cruzan la imagen.',
          'Manchas negras, moradas o verdes que crecen con los días.',
          'Parpadeos, brillo irregular o zonas que no se encienden.',
          'Toques que no responden, que se activan solos o que fallan al usar dos dedos.',
          'El celular suena y vibra, pero la pantalla permanece negra.',
        ],
      },
    ],
  },
  {
    heading: 'Cristal, digitizer y panel OLED: qué se daña en cada caso',
    content: [
      'La pantalla de un celular está formada por varias capas y cada daño afecta una distinta. El cristal es el vidrio externo que recibe los golpes. El digitizer es la capa que detecta el toque de tus dedos. El panel OLED es el que produce la imagen. En algunos modelos estas piezas vienen unidas en un solo módulo, así que el diagnóstico confirma qué se puede reemplazar por separado en tu equipo.',
      'Con esa base, así se entienden los servicios de esta página:',
      {
        list: [
          `Cambio de cristal completo (${pricing.price('cristal')} aproximado, depende del modelo): para cuando el vidrio está roto, pero la imagen y el táctil todavía funcionan.`,
          `Cambio de pantalla OLED (${pricing.price('oled')} según el modelo): para cuando la imagen está dañada, con líneas, manchas o zonas apagadas.`,
          `Cambio de digitizer (${pricing.price('digitizer')} aproximado, depende del modelo): para cuando la imagen se ve bien, pero el táctil falla o responde mal.`,
          `Calibración de sensibilidad (${pricing.price('calibracion')}): para cuando la pantalla es demasiado sensible o poco precisa sin estar rota.`,
          `Restauración multitáctil (${pricing.price('multitactil')}): para cuando los gestos con dos o más dedos, como ampliar una foto, no funcionan.`,
        ],
      },
    ],
  },
  {
    heading: 'Causas más comunes de una pantalla dañada',
    content: [
      'La causa más frecuente es una caída, pero no es la única. La presión dentro de un bolsillo o una mochila, el calor excesivo y el desgaste del propio componente también dañan la imagen o el táctil.',
      [
        'Si la pantalla se ve levantada o abombada, la causa puede ser una batería hinchada que empuja el panel desde dentro. En ese caso revisa también el ',
        { to: '/servicios/cambio-de-bateria', text: 'servicio de cambio de batería' },
        '. Y si el celular se mojó, la humedad puede producir manchas y toques fantasma: lee sobre la ',
        { to: '/servicios/restauracion-dano-de-agua', text: 'restauración por daño de agua' },
        '.',
      ],
    ],
  },
  {
    heading: '¿Cómo es el diagnóstico gratuito y cómo funciona el presupuesto?',
    content: [
      'El diagnóstico no tiene costo. Revisamos el estado del cristal, la imagen y la respuesta táctil, y te explicamos qué pieza está dañada y qué opciones existen para tu modelo.',
      [
        'Después del diagnóstico recibes el presupuesto con el precio final y ningún trabajo comienza hasta que lo apruebes. Los valores de esta página son de referencia porque el costo cambia según el modelo y el repuesto. Compara todos los servicios en la ',
        { to: '/precios', text: 'lista de precios de reparación de celulares' },
        '.',
      ],
    ],
  },
  {
    heading: 'Qué hacer antes de traer tu celular',
    content: [
      {
        list: [
          'Si todavía puedes usarlo, haz una copia de seguridad de tus fotos y datos.',
          'Si el vidrio está astillado, cúbrelo con cinta transparente para evitar cortes y que se desprendan fragmentos.',
          'No presiones ni intentes despegar el cristal por tu cuenta: puedes dañar el panel que está debajo.',
        ],
      },
    ],
  },
  {
    heading: 'Cómo evitar que se vuelva a dañar',
    content: [
      'Un protector de vidrio templado y una funda con borde elevado reducen el riesgo de rotura. Evita guardar el celular en el bolsillo trasero, donde la presión al sentarte puede flexionar la pantalla, y no lo dejes al sol dentro del auto.',
    ],
  },
  {
    heading: 'Garantía en la reparación de pantalla',
    content: [
      [
        'La pantalla que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. No cubre una pantalla rota, golpeada o caída, ni el contacto con agua u otros líquidos, ni el mal uso o la manipulación por terceros. Los detalles están en la página de ',
        { to: '/garantia', text: 'garantía de reparación' },
        '.',
      ],
    ],
  },
  {
    heading: 'Reparamos pantallas en San Borja, Lima',
    content: [
      [
        'Atendemos en Av. San Luis 1873, Tienda 127, dentro del MultiMercado San Borja, de lunes a sábado de 10:00 a 20:00. Antes de venir puedes escribirnos por WhatsApp al +51 924 548 268 o ver cómo llegar en nuestra página de ',
        { to: '/reparacion-de-celulares-san-borja', text: 'reparación de celulares en San Borja' },
        '.',
      ],
    ],
  },
]

const faqs = [
  {
    question: '¿Cuánto cuesta cambiar la pantalla de un celular?',
    answer: `El cambio de pantalla cuesta desde ${pricing.desde}: entre ${pricing.low('oled')} y ${pricing.high('oled')} según el modelo de tu celular. Los demás servicios de esta página van de ${pricing.price('calibracion')} (calibración de sensibilidad) a ${pricing.price('digitizer')} (cambio de digitizer, aproximado). El valor final depende del modelo y del tipo de repuesto, y se confirma en el presupuesto que recibes después del diagnóstico gratuito, antes de iniciar el trabajo.`,
  },
  {
    question: '¿Qué diferencia hay entre cambiar el cristal y cambiar la pantalla?',
    answer: 'El cristal es el vidrio externo. Si solo está roto y la imagen y el táctil funcionan, puede bastar con cambiarlo. Si la imagen tiene líneas, manchas o zonas apagadas, el daño está en el panel y hay que cambiar la pantalla. El diagnóstico confirma cuál es tu caso.',
  },
  {
    question: '¿Cuánto demora el cambio de pantalla?',
    answer: 'Toma de 2 a 3 horas cuando la pantalla debe traerse del almacén. Si dejas un adelanto de la mitad del costo del repuesto, la pantalla se trae antes y, cuando llega, instalamos tu repuesto nuevo en menos de 1 hora.',
  },
  {
    question: '¿Pueden cambiarla el mismo día?',
    answer: 'Sí. Deja un adelanto de la mitad del costo del repuesto, lo traemos del almacén y, cuando llega, instalamos tu repuesto nuevo en menos de 1 hora.',
  },
  {
    question: '¿Puedo seguir usando mi celular si solo tiene el vidrio roto?',
    answer: 'Es mejor repararlo pronto. Un vidrio agrietado puede cortar los dedos, dejar entrar polvo y humedad, y crecer hasta afectar el táctil o la imagen.',
  },
  {
    question: '¿Debo hacer una copia de seguridad antes de la reparación?',
    answer: 'Sí, si puedes hacerlo. Es una buena práctica antes de cualquier reparación.',
  },
  {
    question: '¿La garantía cubre si vuelvo a romper la pantalla?',
    answer: 'No. La garantía no cubre equipos rotos, golpeados o caídos. Sí cubre la pantalla que cambiamos durante 3 meses cuando falla por sí sola.',
  },
]

const related = [
  { to: '/servicios/cambio-de-bateria', text: 'Cambio de batería', note: 'una batería hinchada puede levantar la pantalla' },
  { to: '/servicios/restauracion-dano-de-agua', text: 'Restauración por daño de agua', note: 'qué hacer si el celular se mojó' },
]

const ReparacionPantallaPage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} priceNotes={priceNotes} sections={sections} faqs={faqs} related={related} />
)

export default ReparacionPantallaPage
