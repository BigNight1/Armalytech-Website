import ServicePage from './ServicePage.jsx'
import { pricingFor } from '../../data/pricingData.js'

// Todos los montos salen de data/pricingData.js
const pricing = pricingFor('danio-agua')

const seo = {
  title: '¿Celular Mojado? Reparación por Daño de Agua en Lima',
  description: `¿Se mojó tu celular? Apágalo y tráelo a San Borja. Secado, tratamiento contra la corrosión y recuperación de datos desde ${pricing.desde}. Diagnóstico gratis.`,
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
      "streetAddress": "Av. San Luis 1873, Tienda 127 - MultiMercado San Borja",
      "addressLocality": "San Borja",
      "addressRegion": "Lima",
      "postalCode": "15021",
      "addressCountry": "PE"
    },
    "telephone": "+51924548268"
  },
  "areaServed": { "@type": "City", "name": "Lima" },
  "description": "Restauración de celulares dañados por agua en Lima. Secado, deshumidificación, tratamiento de corrosión y recuperación de datos.",
  "offers": pricing.offers
}

const hero = {
  title: 'Restauración por daño de agua',
  description: '¿Tu celular se cayó al agua? ¡Apágalo de inmediato y no lo conectes al cargador! Tráelo rápido a ArmalyTech en San Borja, Lima. Realizamos un secado profesional, tratamiento químico contra la corrosión y recuperación de datos para darte la mayor probabilidad de salvar tu equipo.'
}

const items = pricing.items

const sections = [
  {
    heading: '¿Qué hacer si se mojó tu celular?',
    content: [
      'Lo que hagas en los primeros minutos influye en el resultado. Sigue estos pasos:',
      {
        list: [
          'Apágalo de inmediato y no intentes encenderlo para comprobar si funciona.',
          'No lo conectes al cargador ni a un cable, aunque el puerto se vea seco.',
          'Retira la funda y, si el modelo lo permite, la bandeja de la SIM o la tarjeta de memoria.',
          'Sécalo por fuera con un paño suave, sin agitarlo ni golpearlo para sacar el agua.',
          'No uses secador de pelo, horno ni calor directo: pueden dañar componentes internos.',
          'Evita el arroz: no seca el interior de forma confiable y puede dejar residuos.',
          'Llévalo a revisión lo antes posible.',
        ],
      },
    ],
  },
  {
    heading: '¿Por qué importa tanto la rapidez?',
    content: [
      'El agua por sí sola no es lo único que daña un celular. Los minerales y la humedad que quedan dentro provocan corrosión en la placa y en los conectores, y ese proceso avanza con el tiempo aunque el equipo parezca funcionar. El agua de mar y las bebidas azucaradas suelen causar más daño que el agua dulce.',
      'Por eso un celular que se mojó puede fallar días después de haberse secado. Cuanto antes se abra y se limpie, mayores son las posibilidades de salvar el equipo, aunque ningún taller puede garantizar la recuperación.',
    ],
  },
  {
    heading: 'Señales de daño por humedad, aunque el celular encienda',
    content: [
      {
        list: [
          'El parlante suena apagado o distorsionado, o el micrófono no capta bien tu voz.',
          'Los botones se sienten duros, pegajosos o dejan de responder.',
          'La pantalla muestra manchas, líneas o toques fantasma.',
          'El celular no carga o la carga se corta.',
          'La batería se descarga con rapidez o el equipo se calienta sin motivo.',
          'El indicador interno de contacto con líquido aparece activado.',
        ],
      },
    ],
  },
  {
    heading: 'Servicios para equipos dañados por agua',
    content: [
      {
        list: [
          `Secado y deshumidificación (${pricing.price('secado')}): elimina la humedad que queda dentro del equipo para frenar nuevos daños.`,
          `Tratamiento de corrosión (${pricing.price('corrosion')}): limpia las zonas oxidadas para evitar fallas futuras.`,
          `Reparación de parlante y micrófono (${pricing.price('parlante-microfono')}): reparación o reemplazo de los componentes de audio afectados.`,
          `Reparación de botones (${pricing.price('botones')}): reparación o reemplazo de botones que dejaron de responder.`,
          `Recuperación de datos (${pricing.price('datos')}): intento de recuperar fotos y archivos de un equipo dañado por agua.`,
        ],
      },
      [
        'Si el puerto fue lo más afectado, revisa también la página de ',
        { to: '/servicios/reparacion-puerto-de-carga', text: 'reparación de puerto de carga' },
        '. Si lo dañado es la imagen o el táctil, la solución está en el ',
        { to: '/servicios/reparacion-de-pantalla', text: 'servicio de reparación de pantalla' },
        '.',
      ],
    ],
  },
  {
    heading: '¿Cómo es el diagnóstico gratuito en un equipo mojado?',
    content: [
      [
        'Revisamos el estado del equipo y de sus componentes para saber qué se afectó y qué se puede reparar. No podemos prometer que un celular mojado se recupere: lo que sí recibes es una explicación clara del estado y un presupuesto con el precio final antes de que empiece cualquier trabajo. Los valores de esta página son de referencia y el resto de servicios están en la lista de ',
        { to: '/precios', text: 'precios' },
        '.',
      ],
    ],
  },
  {
    heading: 'Tus fotos y datos',
    content: [
      'Si el equipo ya no enciende, no insistas en prenderlo: cada intento puede dañar más la placa. Indícanos que tu prioridad son los datos y el diagnóstico te dirá si la recuperación es posible.',
    ],
  },
  {
    heading: 'Cómo reducir el riesgo de un nuevo daño',
    content: [
      {
        list: [
          'Aunque tu celular sea resistente al agua, no es a prueba de agua: los sellos pierden eficacia con el uso y las caídas.',
          'No lo uses cerca de piscina, ducha o lavadero.',
          'No cargues el celular si el puerto está húmedo.',
        ],
      },
    ],
  },
  {
    heading: 'Garantía y daño por agua',
    content: [
      [
        'La garantía de 3 meses se aplica a las piezas que reemplacemos durante el servicio, siempre que fallen por sí solas. No cubre el contacto con agua u otros líquidos después de la entrega, equipos rotos, golpeados o caídos, ni mal uso o manipulación por terceros. Las condiciones generales están en la página de ',
        { to: '/garantia', text: 'garantía de reparación' },
        '.',
      ],
    ],
  },
  {
    heading: 'Restauración por daño de agua en San Borja, Lima',
    content: [
      [
        'Estamos en Av. San Luis 1873, Tienda 127, dentro del MultiMercado San Borja, y atendemos de lunes a sábado de 10:00 a 20:00. Si tu celular se mojó, escríbenos por WhatsApp al +51 924 548 268 o consulta cómo llegar en la página de ',
        { to: '/reparacion-de-celulares-san-borja', text: 'reparación de celulares en San Borja' },
        '.',
      ],
    ],
  },
]

const faqs = [
  {
    question: '¿Cuánto cuesta reparar un celular que se mojó?',
    answer: `Los precios de referencia de esta página van de ${pricing.price('corrosion')} (tratamiento de corrosión) a ${pricing.price('datos')} (recuperación de datos). El valor final depende del daño y del modelo, y se confirma en el presupuesto después del diagnóstico gratuito.`,
  },
  {
    question: '¿Sirve meter el celular mojado en arroz?',
    answer: 'No. El arroz no seca el interior del equipo de forma confiable y puede dejar residuos. Lo recomendable es apagarlo, secarlo por fuera con un paño y llevarlo a revisión sin cargarlo.',
  },
  {
    question: '¿Mi celular funciona bien después de mojarse, debo revisarlo igual?',
    answer: 'Sí. La corrosión avanza con el tiempo y puede causar fallas después, en el parlante, el micrófono, los botones, el puerto de carga o la placa. Una revisión a tiempo reduce el riesgo.',
  },
  {
    question: '¿Cuánto demora la restauración por daño de agua?',
    answer: 'Depende de la complejidad del daño. Confirmamos el tiempo después del diagnóstico gratuito.',
  },
  {
    question: '¿Se pueden recuperar las fotos de un celular que no enciende por agua?',
    answer: 'Depende del daño. Existe el servicio de recuperación de datos para equipos dañados por agua, y el diagnóstico gratuito indica si es posible en tu caso. No se puede asegurar el resultado antes de revisar el equipo.',
  },
  {
    question: '¿La garantía cubre si mi celular se moja después de la reparación?',
    answer: 'No. El contacto con agua u otros líquidos después de la entrega queda fuera de la garantía. Si ya se mojó, escríbenos y evaluamos el caso.',
  },
]

const related = [
  { to: '/servicios/reparacion-puerto-de-carga', text: 'Reparación de puerto de carga', note: 'cuando la humedad afectó la carga' },
  { to: '/servicios/reparacion-de-pantalla', text: 'Reparación de pantalla', note: 'si hay manchas o toques fantasma' },
]

const RestauracionDanoAguaPage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} sections={sections} faqs={faqs} related={related} />
)

export default RestauracionDanoAguaPage
