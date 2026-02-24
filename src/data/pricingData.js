/**
 * Datos para la página de precios (/precios). Todo en español.
 * Reemplazar imágenes placeholder por rutas reales cuando existan.
 */

export const pricingCategories = [
  {
    id: "reparacion-pantalla",
    title: "Reparación de pantalla",
    image: "/precio/Reparaciónpantalla.webp",
    items: [
      { name: "Cambio de pantalla OLED", price: "S/ 185", description: "Pantalla OLED nueva con nuestro servicio de reemplazo." },
      { name: "Cambio de digitizer", price: "S/ 138", description: "Recupera la respuesta táctil con reemplazos precisos." },
      { name: "Cambio de cristal completo", price: "S/ 69", description: "¿Pantalla rota? Reemplazo completo de cristal." },
      { name: "Calibración de sensibilidad", price: "S/ 47", description: "Optimizamos la sensibilidad táctil de tu pantalla." },
      { name: "Restauración multitáctil", price: "S/ 59", description: "Recupera la función multitáctil con nuestro servicio." },
    ],
  },
  {
    id: "cambio-bateria",
    title: "Cambio de batería",
    image: "/precio/Cambiobatería.webp",
    items: [
      { name: "Cambio de batería estándar", price: "S/ 125", description: "Nueva batería para mejorar el rendimiento de tu equipo." },
      { name: "Optimización de energía", price: "S/ 38", description: "Alarga la vida de tu batería con un manejo eficiente." },
      { name: "Instalación de carga rápida", price: "S/ 69", description: "Actualiza a carga rápida." },
      { name: "Batería original (OEM)", price: "S/ 97", description: "Batería del fabricante original." },
      { name: "Cambio de batería el mismo día", price: "S/ 159", description: "Servicio rápido para que no te quedes sin equipo." },
    ],
  },
  {
    id: "puerto-carga",
    title: "Reparación de puerto de carga",
    image: "/precio/Reparaciónpuertocarga.webp",
    items: [
      { name: "Limpieza de puerto de carga", price: "S/ 38", description: "Eliminamos residuos para una carga óptima." },
      { name: "Cambio de puerto", price: "S/ 85", description: "Instalamos un puerto nuevo para carga estable." },
      { name: "Actualización a carga rápida", price: "S/ 69", description: "Mejora a carga más rápida." },
      { name: "Reparación por humedad", price: "S/ 77", description: "Recuperamos el puerto después de daño por agua." },
      { name: "Retrofit a USB-C", price: "S/ 159", description: "Adaptamos equipos antiguos a puerto USB-C." },
    ],
  },
  {
    id: "danio-agua",
    title: "Restauración por daño de agua",
    image: "/precio/Restauracióndañoagua.webp",
    items: [
      { name: "Reparación de parlante y micrófono", price: "S/ 85", description: "Reparamos o reemplazamos componentes dañados por agua." },
      { name: "Secado y deshumidificación", price: "S/ 88", description: "Eliminamos la humedad para evitar más daños." },
      { name: "Reparación de botones", price: "S/ 69", description: "Reparamos o reemplazamos botones dañados." },
      { name: "Tratamiento de corrosión", price: "S/ 47", description: "Tratamos la corrosión para evitar fallas futuras." },
      { name: "Recuperación de datos", price: "S/ 159", description: "Recuperamos datos de equipos dañados por agua." },
    ],
  },
  {
    id: "software",
    title: "Problemas de software",
    image: "/precio/Problemassoftware.webp",
    items: [
      { name: "Diagnóstico", price: "gratis", description: "Evaluamos tu equipo para detectar problemas de software." },
      { name: "Actualización del sistema", price: "S/ 30", description: "Instalamos las últimas actualizaciones de software." },
      { name: "Eliminación de virus y malware", price: "S/ 60", description: "Eliminamos software dañino para proteger tu equipo." },
      { name: "Comprobación de compatibilidad", price: "S/ 20", description: "Verificamos compatibilidad con las últimas apps." },
      { name: "Optimización de rendimiento", price: "S/ 50", description: "Optimizamos la configuración para un uso más fluido." },
    ],
  },
];

export const additionalServices = {
  intro: "Pregunta a nuestros técnicos por otros servicios que ofrecemos para mantener tu celular en buen estado.",
  image: "/pricing-additional.webp",
  items: [
    { name: "Liberación de red", price: "S/ 69", description: "Liberación de Linea extranjera" },
    { name: "Protectores de pantalla", price: "S/ 20", description: "Protege tu pantalla de rayones y golpes." },
    { name: "Respaldo y transferencia de datos", price: "S/ 49", description: "Resguardamos tu información importante." },
    { name: "Personalización del equipo", price: "desde S/ 89", description: "Personalizamos tu equipo a tu gusto." },
  ],
};
