import ServicePage from './ServicePage.jsx'
import { pricingFor } from '../../data/pricingData.js'

// Todos los montos salen de data/pricingData.js
const pricing = pricingFor('puerto-carga')

const seo = {
  title: `Reparación de Puerto de Carga en Lima desde ${pricing.desde}`,
  description: `Reparamos el puerto de carga de tu celular en Lima desde ${pricing.desde}. Limpieza, cambio de puerto, reparación por humedad y adaptación a USB-C. San Borja.`,
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
      "streetAddress": "Av. San Luis 1849-1851, Tienda 127 - MultiMercado San Borja",
      "addressLocality": "San Borja",
      "addressRegion": "Lima",
      "postalCode": "15021",
      "addressCountry": "PE"
    },
    "telephone": "+51924548268"
  },
  "areaServed": { "@type": "City", "name": "Lima" },
  "description": "Reparación de puerto de carga de celulares en Lima. Limpieza, cambio de puerto, reparación por humedad y retrofit a USB-C.",
  "offers": pricing.offers
}

const hero = {
  title: 'Reparación de puerto de carga',
  description: '¿Tu celular no carga correctamente? En ArmalyTech limpiamos y reparamos puertos de carga en Lima. Desde una limpieza simple hasta el cambio completo del conector, lo resolvemos en nuestro local de San Borja, en 1 a 2 horas.'
}

const items = pricing.items

const priceNotes = [
  {
    lead: 'Sin adelanto.',
    text: 'Tenemos zócalos de carga en stock para la mayoría de modelos, así que la reparación se hace al momento.',
  },
]

const sections = [
  {
    heading: 'Señales de que el puerto de carga tiene un problema',
    content: [
      'El puerto de carga es una de las piezas que más se usa y que más se desgasta. Estas son las señales que suelen aparecer primero:',
      {
        list: [
          'Solo carga si mueves el cable o lo sostienes en cierta posición.',
          'La carga es muy lenta o se corta y vuelve a empezar.',
          'El cable entra flojo y se sale con facilidad.',
          'El equipo no carga aunque el cable y el cargador funcionen en otro celular.',
          'Aparece un aviso de humedad o líquido en el puerto.',
          'El conector se calienta mientras carga o se ve sucio, oscuro o con restos verdosos.',
        ],
      },
    ],
  },
  {
    heading: 'Causas más comunes de una carga que falla',
    content: [
      'La causa más frecuente es la suciedad: la pelusa y el polvo del bolsillo o de la mochila se compactan dentro del puerto y evitan que el cable haga contacto completo. Le siguen el desgaste por el uso diario, los cables o cargadores de mala calidad, el hábito de tirar del cable en lugar del conector, y los golpes al celular mientras está conectado.',
      [
        'La humedad es otra causa importante. Si el equipo estuvo en contacto con líquido, los contactos del puerto pueden oxidarse con el tiempo, aunque al principio parezca que todo funciona. Si ese es tu caso, revisa también la página de ',
        { to: '/servicios/restauracion-dano-de-agua', text: 'restauración por daño de agua' },
        '.',
      ],
    ],
  },
  {
    heading: 'Antes de cambiar el puerto: pruebas que puedes hacer en casa',
    content: [
      {
        list: [
          'Prueba otro cable y otro cargador, de preferencia en un enchufe distinto.',
          'Reinicia el equipo para descartar un fallo temporal del sistema.',
          'Mira el puerto con una linterna para ver si hay suciedad visible.',
          'No introduzcas agujas, clips ni objetos metálicos: pueden dañar los contactos y empeorar el problema.',
        ],
      },
      [
        'Si con otro cable y otro cargador sigue igual, el problema suele estar en el puerto. Si carga bien pero la batería dura muy poco, mira el ',
        { to: '/servicios/cambio-de-bateria', text: 'servicio de cambio de batería' },
        '.',
      ],
    ],
  },
  {
    heading: 'Servicios de reparación del puerto de carga',
    content: [
      {
        list: [
          `Limpieza de puerto de carga (${pricing.price('limpieza')}): retira la suciedad que impide el contacto. Es la opción cuando el puerto no está dañado.`,
          `Cambio de puerto (${pricing.price('cambio-puerto')}): se instala un puerto nuevo cuando los contactos están gastados, doblados o rotos.`,
          `Reparación por humedad (${pricing.price('humedad')}): para puertos afectados por agua u otros líquidos, donde hay que tratar la corrosión.`,
          `Actualización a carga rápida (${pricing.price('carga-rapida')}): mejora para cargar más rápido. Depende también del cargador y del cable que uses.`,
          `Retrofit a USB-C (${pricing.price('retrofit')}): adapta equipos antiguos a un puerto USB-C. El diagnóstico confirma si tu modelo admite la adaptación.`,
        ],
      },
    ],
  },
  {
    heading: '¿Cómo funciona el diagnóstico gratuito y el presupuesto?',
    content: [
      [
        'Revisamos el puerto y comprobamos si la falla viene del conector, del cable, del cargador o de otra parte del equipo. Después de eso recibes el presupuesto con el precio final y ningún trabajo empieza hasta que lo apruebes. Los valores de esta página son de referencia; puedes ver los demás servicios en la lista de ',
        { to: '/precios', text: 'precios de reparación de celulares' },
        '.',
      ],
    ],
  },
  {
    heading: 'Cómo cuidar el puerto de carga',
    content: [
      {
        list: [
          'Desconecta el cable tirando del conector, nunca del cable.',
          'Evita usar el celular en una posición forzada mientras está cargando.',
          'Guarda el equipo en un bolsillo sin pelusa o usa una funda con tapa para el puerto.',
          'Usa cargadores y cables de buena calidad.',
          'Si el equipo se mojó, no lo conectes hasta que esté completamente seco y revisado.',
        ],
      },
    ],
  },
  {
    heading: 'Garantía en la reparación del puerto',
    content: [
      [
        'El repuesto que cambiamos, como un puerto nuevo, tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. No cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros. Lee las condiciones en la página de ',
        { to: '/garantia', text: 'garantía de reparación' },
        '.',
      ],
    ],
  },
  {
    heading: 'Reparación de puerto de carga en San Borja, Lima',
    content: [
      [
        'Atendemos en Av. San Luis 1849-1851, Tienda 127, en el MultiMercado San Borja, de lunes a sábado de 10:00 a 20:00. Encuentra cómo llegar en la página de ',
        { to: '/reparacion-de-celulares-san-borja', text: 'reparación de celulares en San Borja' },
        ' o escríbenos por WhatsApp al +51 924 548 268.',
      ],
    ],
  },
]

const faqs = [
  {
    question: '¿Cuánto cuesta reparar el puerto de carga de un celular?',
    answer: `Los precios de referencia de esta página van de ${pricing.price('limpieza')} (limpieza de puerto) a ${pricing.price('retrofit')} (retrofit a USB-C). El cambio de puerto tiene un precio de referencia de ${pricing.price('cambio-puerto')}. El valor final se confirma tras el diagnóstico gratuito y antes de iniciar el trabajo.`,
  },
  {
    question: '¿Cuánto demora la reparación del puerto de carga?',
    answer: 'La reparación del puerto de carga (zócalo) toma de 1 a 2 horas. Tenemos zócalos de carga en stock para la mayoría de modelos, así que la reparación se hace al momento.',
  },
  {
    question: '¿Necesito dejar un adelanto para reparar el puerto de carga?',
    answer: 'No. Tenemos zócalos de carga en stock para la mayoría de modelos, así que la reparación se hace al momento y no hace falta adelanto. Para confirmar que tenemos el zócalo de tu modelo, escríbenos por WhatsApp o pasa por la tienda.',
  },
  {
    question: '¿Mi celular no carga: es el puerto o es la batería?',
    answer: 'Prueba primero con otro cable y otro cargador. Si no carga o solo carga moviendo el cable, lo más probable es el puerto. Si carga normal pero la batería dura muy poco o se apaga con porcentaje alto, es más probable que sea la batería. El diagnóstico gratuito lo confirma.',
  },
  {
    question: '¿Se puede arreglar con una limpieza o hay que cambiar el puerto?',
    answer: 'Depende del estado del puerto. Si solo hay suciedad compactada, una limpieza suele ser suficiente. Si los contactos están doblados, gastados o corroídos, hace falta reparar o cambiar el puerto.',
  },
  {
    question: '¿Qué hago si mi celular muestra un aviso de humedad en el puerto?',
    answer: 'Desconecta el cable, no sigas cargando el equipo y deja que se seque. Si el aviso continúa o el equipo se mojó, tráelo para revisar el puerto antes de volver a conectarlo.',
  },
  {
    question: '¿Se puede pasar un celular antiguo a USB-C?',
    answer: 'Ofrecemos el retrofit a USB-C para adaptar equipos antiguos a un puerto USB-C. No todos los modelos lo admiten, así que el diagnóstico confirma si el tuyo es compatible.',
  },
]

const related = [
  { to: '/servicios/cambio-de-bateria', text: 'Cambio de batería', note: 'si carga bien pero la batería dura poco' },
  { to: '/servicios/restauracion-dano-de-agua', text: 'Restauración por daño de agua', note: 'cuando la falla de carga viene de un líquido' },
]

const ReparacionPuertoCargaPage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} priceNotes={priceNotes} sections={sections} faqs={faqs} related={related} />
)

export default ReparacionPuertoCargaPage
