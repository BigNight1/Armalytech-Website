import ServicePage from './ServicePage.jsx'
import { pricingFor } from '../../data/pricingData.js'

// Todos los montos salen de data/pricingData.js ("Gratis" con mayúscula en la lista de esta página)
const pricing = pricingFor('software', { capitalize: true })

const seo = {
  title: '¿Celular Lento o con Virus? Reparación de Software en Lima',
  description: '¿Tu celular va lento, tiene virus o no actualiza? Lo diagnosticamos gratis en San Borja y lo optimizamos para que funcione como nuevo.',
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
      "streetAddress": "Av. San Luis 1873, Tienda 127 - MultiMercado San Borja",
      "addressLocality": "San Borja",
      "addressRegion": "Lima",
      "postalCode": "15021",
      "addressCountry": "PE"
    },
    "telephone": "+51924548268"
  },
  "areaServed": { "@type": "City", "name": "Lima" },
  "description": "Reparación de problemas de software en celulares en Lima. Virus, actualizaciones, optimización y compatibilidad.",
  "offers": pricing.offers
}

const hero = {
  title: 'Problemas de software',
  description: '¿Tu celular va lento, tiene virus o no actualiza? En ArmalyTech diagnosticamos y solucionamos problemas de software en Lima completamente gratis. Optimizamos tu equipo para que funcione como nuevo en nuestro local de San Borja.'
}

const items = pricing.items

const sections = [
  {
    heading: 'Señales de un problema de software',
    content: [
      'Un celular puede estar en perfecto estado físico y aun así funcionar mal. Estas son las señales que apuntan al sistema o a las aplicaciones:',
      {
        list: [
          'Va lento al abrir aplicaciones, escribir o cambiar de pantalla.',
          'Las aplicaciones se cierran solas o se quedan congeladas.',
          'Aparece publicidad emergente fuera de las aplicaciones o en el navegador.',
          'Hay aplicaciones que no recuerdas haber instalado.',
          'La batería o los datos móviles se consumen más de lo normal sin que lo uses.',
          'El sistema no se actualiza o muestra errores al intentar hacerlo.',
          'Avisa constantemente que el almacenamiento está lleno.',
        ],
      },
    ],
  },
  {
    heading: 'Causas más comunes',
    content: [
      'La mayoría de los problemas de software nace de pocas causas: el almacenamiento casi lleno, demasiadas aplicaciones funcionando en segundo plano, un sistema desactualizado o una actualización que se interrumpió. En equipos más antiguos, las aplicaciones nuevas piden más recursos de los que el celular puede dar.',
      'También existe el malware. Suele llegar por aplicaciones instaladas fuera de las tiendas oficiales, archivos de origen dudoso o enlaces recibidos por mensaje, correo o redes sociales. Su efecto va desde la publicidad invasiva hasta el robo de datos personales.',
    ],
  },
  {
    heading: 'Servicios de software y cuándo conviene cada uno',
    content: [
      {
        list: [
          'Diagnóstico (gratis): evaluamos el equipo para saber si el problema es de software, de hardware o una mezcla de ambos.',
          `Actualización del sistema (${pricing.price('actualizacion')}): instalación de las actualizaciones disponibles, que corrigen errores y fallas de seguridad.`,
          `Eliminación de virus y malware (${pricing.price('virus')}): para cuando hay publicidad invasiva, aplicaciones desconocidas o consumo anormal.`,
          `Comprobación de compatibilidad (${pricing.price('compatibilidad')}): verificamos si tu equipo puede ejecutar las últimas aplicaciones.`,
          `Optimización de rendimiento (${pricing.price('optimizacion')}): ajustes de configuración para que el celular funcione con más fluidez.`,
        ],
      },
    ],
  },
  {
    heading: 'Cuando parece software, pero es hardware',
    content: [
      [
        'No todo lo lento es software. Si la duración de la carga cayó de golpe o el celular se apaga con porcentaje alto, puede tratarse de la batería y conviene mirar el ',
        { to: '/servicios/cambio-de-bateria', text: 'servicio de cambio de batería' },
        '. Si el equipo reacciona mal al tacto o la imagen falla, la causa puede estar en la ',
        { to: '/servicios/reparacion-de-pantalla', text: 'pantalla' },
        '. Por eso el diagnóstico revisa ambas cosas antes de proponer una solución.',
      ],
    ],
  },
  {
    heading: '¿Cómo funciona el diagnóstico gratuito?',
    content: [
      [
        'Revisamos el equipo, te explicamos qué encontramos y qué opciones hay. Si el problema no es de software, te lo decimos. Antes de empezar cualquier trabajo recibes un presupuesto con el precio final. Los valores de esta página son de referencia y puedes comparar todos los servicios en la lista de ',
        { to: '/precios', text: 'precios de reparación de celulares' },
        '.',
      ],
    ],
  },
  {
    heading: 'Qué hacer antes de traer tu celular',
    content: [
      {
        list: [
          'Haz una copia de seguridad de tus fotos, contactos y mensajes si el equipo lo permite.',
          'Anota desde cuándo ocurre la falla y qué cambió antes: una aplicación nueva, una actualización o un enlace que abriste.',
          'Si sospechas de malware, cambia las contraseñas de tu correo y de tus cuentas bancarias desde otro dispositivo.',
          'No instales aplicaciones de limpieza o antivirus desconocidas: muchas empeoran el problema.',
        ],
      },
    ],
  },
  {
    heading: 'Cómo evitar problemas de software',
    content: [
      {
        list: [
          'Instala aplicaciones solo desde la tienda oficial de tu sistema.',
          'No abras enlaces ni archivos de personas o números desconocidos.',
          'Actualiza el sistema y las aplicaciones cuando haya nuevas versiones.',
          'Mantén libre una parte del almacenamiento y borra lo que no uses.',
          'Reinicia el celular de vez en cuando y revisa los permisos que otorgas a cada aplicación.',
        ],
      },
    ],
  },
  {
    heading: 'Garantía en los servicios de software',
    content: [
      [
        'Los servicios de software no instalan repuestos, así que la garantía de 3 meses se aplica a las piezas que cambiemos durante el servicio, siempre que fallen por sí solas. No cubre mal uso ni manipulación por terceros. Si tienes dudas sobre tu caso, lee la página de ',
        { to: '/garantia', text: 'garantía de reparación' },
        ' o pregúntanos antes de aprobar el presupuesto.',
      ],
    ],
  },
  {
    heading: 'Servicio de software en San Borja, Lima',
    content: [
      [
        'Nuestra tienda está en Av. San Luis 1873, Tienda 127, dentro del MultiMercado San Borja, y atendemos de lunes a sábado de 10:00 a 20:00. Puedes escribirnos por WhatsApp al +51 924 548 268 o ver cómo llegar en la página de ',
        { to: '/reparacion-de-celulares-san-borja', text: 'reparación de celulares en San Borja' },
        '.',
      ],
    ],
  },
]

const faqs = [
  {
    question: '¿Cuánto cuesta reparar problemas de software en un celular?',
    answer: `El diagnóstico es gratis. Los precios de referencia de esta página son ${pricing.price('compatibilidad')} por la comprobación de compatibilidad, ${pricing.price('actualizacion')} por la actualización del sistema, ${pricing.price('optimizacion')} por la optimización de rendimiento y ${pricing.price('virus')} por la eliminación de virus y malware. El precio final se confirma antes de iniciar el trabajo.`,
  },
  {
    question: '¿Cómo sé si mi celular tiene virus?',
    answer: 'Las señales más habituales son publicidad emergente fuera de las aplicaciones, aplicaciones que no instalaste, consumo anormal de batería o datos y un rendimiento que empeora de golpe. Si notas varias a la vez, conviene revisarlo.',
  },
  {
    question: '¿Por qué mi celular no se actualiza?',
    answer: 'Las causas comunes son poco espacio de almacenamiento, batería baja, mala conexión a internet o una actualización interrumpida. En equipos antiguos también puede ocurrir que el fabricante ya no ofrezca más versiones para ese modelo.',
  },
  {
    question: '¿Cuánto demora reparar un problema de software?',
    answer: 'Depende de la complejidad del caso. Confirmamos el tiempo después del diagnóstico gratuito, antes de iniciar el trabajo.',
  },
  {
    question: '¿Pierdo mis datos al reparar un problema de software?',
    answer: 'Depende del procedimiento que requiera tu caso. Por eso conviene hacer una copia de seguridad antes y consultar durante el diagnóstico qué implica el trabajo, que no empieza hasta que apruebes el presupuesto.',
  },
  {
    question: '¿Mi celular está lento por software o por la batería?',
    answer: 'Puede ser cualquiera de los dos. Si va lento todo el tiempo y el almacenamiento está lleno, suele ser software. Si se apaga de golpe o la carga dura muy poco, la causa puede ser la batería. El diagnóstico gratuito revisa ambas posibilidades.',
  },
]

const related = [
  { to: '/servicios/cambio-de-bateria', text: 'Cambio de batería', note: 'si la duración de la carga cayó de golpe' },
  { to: '/servicios/reparacion-de-pantalla', text: 'Reparación de pantalla', note: 'si el táctil o la imagen fallan' },
]

const ProblemasoftwarePage = () => (
  <ServicePage seo={seo} schema={schema} hero={hero} items={items} sections={sections} faqs={faqs} related={related} />
)

export default ProblemasoftwarePage
