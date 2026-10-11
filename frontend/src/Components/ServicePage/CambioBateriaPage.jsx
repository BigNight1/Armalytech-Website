import ServicePage from './ServicePage.jsx'
import { pricingFor } from '../../data/pricingData.js'

// Todos los montos salen de data/pricingData.js
const pricing = pricingFor('cambio-bateria')

const seo = {
  title: 'Cambio de Batería de Celular en Lima el Mismo Día',
  description: `Cambiamos la batería de tu celular en San Borja el mismo día, desde ${pricing.desde} (hasta ${pricing.high('estandar')} según el modelo). Diagnóstico gratis y 3 meses de garantía.`,
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
      "streetAddress": "Av. San Luis 1873, Tienda 127 - MultiMercado San Borja",
      "addressLocality": "San Borja",
      "addressRegion": "Lima",
      "postalCode": "15021",
      "addressCountry": "PE"
    },
    "telephone": "+51924548268"
  },
  "areaServed": { "@type": "City", "name": "Lima" },
  "description": "Servicio de cambio de batería de celulares en Lima. Baterías estándar, originales OEM y cambio el mismo día con adelanto.",
  "offers": pricing.offers
}

const hero = {
  title: 'Cambio de batería',
  description: 'Devuelve la vida a tu celular con un cambio de batería profesional en Lima. Trabajamos con baterías originales OEM y estándar de alta calidad. Si la necesitas el mismo día, deja un adelanto y la cambiamos en nuestro local de San Borja.'
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
    heading: 'Señales de que tu batería necesita cambio',
    content: [
      'La batería se desgasta de forma gradual, por eso muchas personas se acostumbran a sus fallas. Estas señales indican que ya es momento de revisarla:',
      {
        list: [
          'Se descarga mucho más rápido que antes y necesitas cargarlo a media tarde.',
          'Se apaga de golpe aunque el indicador marque un porcentaje alto.',
          'El porcentaje salta, por ejemplo de 40 % a 15 %, sin motivo aparente.',
          'Se calienta de forma notoria mientras carga o en uso normal.',
          'Se reinicia solo o se vuelve lento cuando la carga baja.',
          'La tapa trasera o la pantalla se ven levantadas, como si algo empujara desde dentro.',
        ],
      },
      'Esta última señal es la más seria: puede ser una batería hinchada. Si la ves, deja de cargar el equipo, no lo aprietes ni intentes abrirlo y tráelo para que lo revisemos.',
    ],
  },
  {
    heading: '¿Por qué se desgasta la batería de un celular?',
    content: [
      'Las baterías de ion de litio pierden capacidad con cada ciclo de carga y con el paso del tiempo. El desgaste se acelera con el calor, con cargadores de baja calidad y con el hábito de dejar el equipo muchas horas en 0 % o al 100 %.',
    ],
  },
  {
    heading: 'Opciones de cambio de batería que ofrecemos',
    content: [
      'Cada opción de esta página responde a una necesidad distinta:',
      {
        list: [
          `Cambio de batería estándar (${pricing.price('estandar')} según el modelo): reemplazo por una batería nueva para recuperar autonomía.`,
          `Batería original (OEM) (${pricing.price('oem')} según el modelo): batería del fabricante original, para quien prefiere esa opción.`,
          `Instalación de carga rápida (${pricing.price('carga-rapida')}): actualización para cargar más rápido. La carga rápida depende también del cargador, del cable y del propio equipo, y el diagnóstico confirma si tu modelo la admite.`,
          `Optimización de energía (${pricing.price('energia')}): ajustes para alargar la duración cuando la batería todavía está en buen estado.`,
        ],
      },
    ],
  },
  {
    heading: '¿Qué revisamos en el diagnóstico gratuito?',
    content: [
      [
        'Antes de recomendar una batería nueva comprobamos que la falla realmente venga de ahí. Una duración corta también puede deberse a aplicaciones que consumen en segundo plano, algo que se resuelve con una revisión de ',
        { to: '/servicios/problemas-de-software', text: 'problemas de software' },
        ', o a un puerto de carga sucio o dañado que impide cargar bien, caso que corresponde a la ',
        { to: '/servicios/reparacion-puerto-de-carga', text: 'reparación de puerto de carga' },
        '.',
      ],
      [
        'Cuando el problema sí es la batería, recibes el presupuesto con el precio final antes de que empiece cualquier trabajo. Los valores de la lista son de referencia y puedes ver el resto de servicios en la página de ',
        { to: '/precios', text: 'precios' },
        '.',
      ],
    ],
  },
  {
    heading: 'Qué hacer antes de traer tu celular',
    content: [
      {
        list: [
          'Haz una copia de seguridad de tus fotos y datos si el equipo todavía enciende.',
          'Anota qué porcentaje marca cuando se apaga y desde cuándo ocurre. Ayuda a ubicar la causa.',
          'Si sospechas que la batería está hinchada, no la cargues, no presiones el equipo y no lo guardes cerca de objetos que lo aprieten.',
        ],
      },
    ],
  },
  {
    heading: 'Cómo alargar la vida de la batería nueva',
    content: [
      {
        list: [
          'Usa cargadores y cables de buena calidad, no los más baratos de la calle.',
          'No lo dejes cargando bajo la almohada, al sol o dentro de una funda que atrape calor.',
          'Evita bajar de forma habitual a 0 % y mantén la carga entre 20 % y 80 % cuando puedas.',
        ],
      },
    ],
  },
  {
    heading: 'Garantía en el cambio de batería',
    content: [
      [
        'La batería que instalamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. No cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros. Consulta las condiciones completas en la página de ',
        { to: '/garantia', text: 'garantía de reparación' },
        '.',
      ],
    ],
  },
  {
    heading: 'Cambio de batería en San Borja, Lima',
    content: [
      [
        'Estamos en Av. San Luis 1873, Tienda 127, dentro del MultiMercado San Borja, y atendemos de lunes a sábado de 10:00 a 20:00. Si prefieres consultar primero, escríbenos por WhatsApp al +51 924 548 268 o revisa la página de ',
        { to: '/reparacion-de-celulares-san-borja', text: 'reparación de celulares en San Borja' },
        '.',
      ],
    ],
  },
]

const faqs = [
  {
    question: '¿Cuánto cuesta cambiar la batería de un celular?',
    answer: `El cambio de batería cuesta desde ${pricing.desde}: entre ${pricing.low('estandar')} y ${pricing.high('estandar')} según el modelo de tu celular, tanto con la batería estándar como con la original (OEM). El valor final depende del modelo y se confirma después del diagnóstico gratuito, antes de iniciar el trabajo.`,
  },
  {
    question: '¿Cómo sé si necesito una batería nueva o es un problema de software?',
    answer: 'Si el celular dura poco pero no se calienta ni se apaga de golpe, puede ser consumo de aplicaciones o del sistema. Si se apaga con porcentaje alto, salta de nivel o la batería se ve hinchada, lo más probable es que la batería esté desgastada. El diagnóstico gratuito lo confirma.',
  },
  {
    question: '¿Qué hago si mi batería está hinchada?',
    answer: 'Deja de cargar el equipo, no lo presiones ni intentes abrirlo y llévalo a revisión lo antes posible. Una batería hinchada no debe seguir en uso.',
  },
  {
    question: '¿Qué diferencia hay entre la batería estándar y la original OEM?',
    answer: 'La batería original (OEM) es la del fabricante original, según la descripción del servicio. La batería estándar es la opción regular de reemplazo. Durante el diagnóstico te explicamos qué opciones hay para tu modelo.',
  },
  {
    question: '¿La garantía cubre la batería nueva?',
    answer: 'Sí. La batería que instalamos tiene 3 meses de garantía cuando falla por sí sola. No cubre golpes, caídas, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros.',
  },
  {
    question: '¿Pueden cambiarla el mismo día?',
    answer: 'Sí. Deja un adelanto de la mitad del costo del repuesto, lo traemos del almacén y, cuando llega, instalamos tu repuesto nuevo en menos de 1 hora.',
  },
]

const related = [
  { to: '/servicios/reparacion-puerto-de-carga', text: 'Reparación de puerto de carga', note: 'si el celular no carga bien, el problema puede estar en el puerto' },
  { to: '/servicios/problemas-de-software', text: 'Problemas de software', note: 'cuando la batería dura poco por causas del sistema' },
]

const CambioBateriaPage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} priceNotes={priceNotes} sections={sections} faqs={faqs} related={related} />
)

export default CambioBateriaPage
