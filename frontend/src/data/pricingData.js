/**
 * Única fuente de precios del sitio público: cambia un monto aquí y se actualiza en Home, /precios, páginas de servicio, FAQ y datos estructurados.
 *
 * Datos para la página de precios (/precios). Todo en español.
 * Reemplazar imágenes placeholder por rutas reales cuando existan.
 *
 * Formato de cada fila (`items`):
 *   id            clave estable de la fila (única dentro de su categoría)
 *   price         número (S/ 90), rango { min, max } (S/ 90 – S/ 110) o 0 (gratis)
 *   desde         true para mostrarlo como "desde S/ 89"
 *
 * Cada categoría tiene un `id` estable que también es el ancla de la sección en /precios
 * (`id` del <section>) y `desdeRows`: las filas que cuentan para el "Desde S/ X" de la
 * Home y del carrusel (el mínimo de esas filas). Las filas fuera de `desdeRows` son otros
 * servicios (p. ej. calibración de pantalla u optimización de energía) y no lo bajan.
 */

export const pricingCategories = [
  {
    id: "reparacion-pantalla",
    title: "Reparación de pantalla",
    image: "/precio/Reparaciónpantalla.webp",
    desdeRows: ["oled", "digitizer", "cristal"],
    items: [
      { id: "oled", name: "Cambio de pantalla OLED", price: { min: 90, max: 110 }, description: "Pantalla OLED nueva con nuestro servicio de reemplazo. El precio depende del modelo." },
      { id: "digitizer", name: "Cambio de digitizer", price: 140, description: "Recupera la respuesta táctil con reemplazos precisos. Precio aproximado: depende del modelo. Escríbenos para cotizar el tuyo." },
      { id: "cristal", name: "Cambio de cristal completo", price: 90, description: "¿Pantalla rota? Reemplazo completo de cristal. Precio aproximado: depende del modelo. Escríbenos para cotizar el tuyo." },
      { id: "calibracion", name: "Calibración de sensibilidad", price: 47, description: "Optimizamos la sensibilidad táctil de tu pantalla." },
      { id: "multitactil", name: "Restauración multitáctil", price: 59, description: "Recupera la función multitáctil con nuestro servicio." },
    ],
  },
  {
    id: "cambio-bateria",
    title: "Cambio de batería",
    image: "/precio/Cambiobatería.webp",
    desdeRows: ["estandar", "oem"],
    items: [
      { id: "estandar", name: "Cambio de batería estándar", price: { min: 50, max: 90 }, description: "Nueva batería para mejorar el rendimiento de tu equipo. El precio depende del modelo." },
      { id: "energia", name: "Optimización de energía", price: 38, description: "Alarga la vida de tu batería con un manejo eficiente." },
      { id: "carga-rapida", name: "Instalación de carga rápida", price: 69, description: "Actualiza a carga rápida." },
      { id: "oem", name: "Batería original (OEM)", price: { min: 50, max: 90 }, description: "Batería del fabricante original. El precio depende del modelo." },
    ],
  },
  {
    id: "puerto-carga",
    title: "Reparación de puerto de carga",
    image: "/precio/Reparaciónpuertocarga.webp",
    desdeRows: ["limpieza", "cambio-puerto", "carga-rapida", "humedad", "retrofit"],
    items: [
      { id: "limpieza", name: "Limpieza de puerto de carga", price: 38, description: "Eliminamos residuos para una carga óptima." },
      { id: "cambio-puerto", name: "Cambio de puerto", price: 85, description: "Instalamos un puerto nuevo para carga estable." },
      { id: "carga-rapida", name: "Actualización a carga rápida", price: 69, description: "Mejora a carga más rápida." },
      { id: "humedad", name: "Reparación por humedad", price: 77, description: "Recuperamos el puerto después de daño por agua." },
      { id: "retrofit", name: "Retrofit a USB-C", price: 159, description: "Adaptamos equipos antiguos a puerto USB-C." },
    ],
  },
  {
    id: "danio-agua",
    title: "Restauración por daño de agua",
    image: "/precio/Restauracióndañoagua.webp",
    desdeRows: ["parlante-microfono", "secado", "botones", "corrosion", "datos"],
    items: [
      { id: "parlante-microfono", name: "Reparación de parlante y micrófono", price: 85, description: "Reparamos o reemplazamos componentes dañados por agua." },
      { id: "secado", name: "Secado y deshumidificación", price: 88, description: "Eliminamos la humedad para evitar más daños." },
      { id: "botones", name: "Reparación de botones", price: 69, description: "Reparamos o reemplazamos botones dañados." },
      { id: "corrosion", name: "Tratamiento de corrosión", price: 47, description: "Tratamos la corrosión para evitar fallas futuras." },
      { id: "datos", name: "Recuperación de datos", price: 159, description: "Recuperamos datos de equipos dañados por agua." },
    ],
  },
  {
    id: "software",
    title: "Problemas de software",
    image: "/precio/Problemassoftware.webp",
    desdeRows: ["actualizacion", "virus", "compatibilidad", "optimizacion"],
    items: [
      { id: "diagnostico", name: "Diagnóstico", price: 0, description: "Evaluamos tu equipo para detectar problemas de software." },
      { id: "actualizacion", name: "Actualización del sistema", price: 30, description: "Instalamos las últimas actualizaciones de software." },
      { id: "virus", name: "Eliminación de virus y malware", price: 60, description: "Eliminamos software dañino para proteger tu equipo." },
      { id: "compatibilidad", name: "Comprobación de compatibilidad", price: 20, description: "Verificamos compatibilidad con las últimas apps." },
      { id: "optimizacion", name: "Optimización de rendimiento", price: 50, description: "Optimizamos la configuración para un uso más fluido." },
    ],
  },
];

export const additionalServices = {
  id: "adicionales",
  intro: "Pregunta a nuestros técnicos por otros servicios que ofrecemos para mantener tu celular en buen estado.",
  image: "/pricing-additional.webp",
  items: [
    { id: "liberacion-red", name: "Liberación de red", price: 69, description: "Liberación de Linea extranjera" },
    { id: "protectores", name: "Protectores de pantalla", price: 20, description: "Protege tu pantalla de rayones y golpes." },
    { id: "respaldo-datos", name: "Respaldo y transferencia de datos", price: 49, description: "Resguardamos tu información importante." },
    { id: "personalizacion", name: "Personalización del equipo", price: 89, desde: true, description: "Personalizamos tu equipo a tu gusto." },
    { id: "wifi-bluetooth", name: "WiFi y Bluetooth", price: 140, desde: true, description: "Diagnóstico y reparación de conectividad inalámbrica. Precio aproximado: depende del modelo. Escríbenos para cotizar el tuyo." },
  ],
};

// ---------------------------------------------------------------------------
// Helpers: los componentes y páginas leen los montos solo a través de estas funciones.
// ---------------------------------------------------------------------------

const allCategories = [...pricingCategories, additionalServices];

/** Rango { min, max } de una fila (un precio fijo tiene min === max). */
const rangeOf = (row) => (typeof row.price === "object" ? row.price : { min: row.price, max: row.price });

/** 90 -> "S/ 90" */
export const formatSoles = (amount) => `S/ ${amount}`;

/**
 * Texto de precio de una fila: "S/ 90", "S/ 90 – S/ 110", "desde S/ 89" o "gratis".
 * `capitalize` pone la primera letra en mayúscula ("Gratis").
 */
export function formatPrice(row, { capitalize = false } = {}) {
  const { min, max } = rangeOf(row);
  let text;
  if (max === 0) text = "gratis";
  else if (min !== max) text = `${formatSoles(min)} – ${formatSoles(max)}`;
  else text = row.desde ? `desde ${formatSoles(min)}` : formatSoles(min);
  return capitalize ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Categoría por id (incluye "adicionales"). Falla en build si el id no existe. */
export function getCategory(id) {
  const category = allCategories.find((c) => c.id === id);
  if (!category) throw new Error(`Categoría de precios desconocida: "${id}"`);
  return category;
}

/** Fila por id dentro de una categoría. Falla en build si no existe. */
export function getRow(categoryId, rowId) {
  const row = getCategory(categoryId).items.find((item) => item.id === rowId);
  if (!row) throw new Error(`Fila de precios desconocida: "${categoryId}/${rowId}"`);
  return row;
}

/** { min, max } en soles de una fila. */
export const getAmounts = (categoryId, rowId) => rangeOf(getRow(categoryId, rowId));

/**
 * Monto del "Desde S/ X": el mínimo de las filas `desdeRows` de la categoría,
 * o el mínimo de una fila concreta si se pasa `rowId` (p. ej. parlantes, WiFi).
 */
export function getDesde(categoryId, rowId) {
  if (rowId) return getAmounts(categoryId, rowId).min;
  const { desdeRows } = getCategory(categoryId);
  if (!desdeRows?.length) throw new Error(`La categoría "${categoryId}" no define desdeRows`);
  return Math.min(...desdeRows.map((id) => getAmounts(categoryId, id).min));
}

/** Filas listas para pintar: { id, name, price (texto), description }. */
export function getDisplayItems(categoryId, options) {
  return getCategory(categoryId).items.map((row) => ({
    id: row.id,
    name: row.name,
    price: formatPrice(row, options),
    description: row.description,
  }));
}

/** Ofertas JSON-LD (schema.org) de una categoría; los rangos salen como AggregateOffer. */
export function getOffers(categoryId) {
  return getCategory(categoryId).items.map((row) => {
    const { min, max } = rangeOf(row);
    return min !== max
      ? { "@type": "AggregateOffer", name: row.name, lowPrice: String(min), highPrice: String(max), priceCurrency: "PEN" }
      : { "@type": "Offer", name: row.name, price: String(min), priceCurrency: "PEN" };
  });
}

/** "S/ 20 – S/ 159": mínimo y máximo de todos los montos de pago del sitio (excluye lo gratis). */
export function getPriceRange() {
  const amounts = allCategories
    .flatMap((category) => category.items)
    .flatMap((row) => Object.values(rangeOf(row)))
    .filter((amount) => amount > 0);
  return `${formatSoles(Math.min(...amounts))} – ${formatSoles(Math.max(...amounts))}`;
}

/**
 * Atajo para las páginas de servicio de una categoría:
 *   desde            "S/ 90"                  (Desde de la categoría)
 *   price(rowId)     "S/ 90 – S/ 110"         (texto de precio de una fila)
 *   low/high(rowId)  "S/ 90" / "S/ 110"       (extremos de una fila)
 *   items, offers    lista de precios y JSON-LD
 */
export function pricingFor(categoryId, options) {
  return {
    desde: formatSoles(getDesde(categoryId)),
    price: (rowId) => formatPrice(getRow(categoryId, rowId)),
    low: (rowId) => formatSoles(getAmounts(categoryId, rowId).min),
    high: (rowId) => formatSoles(getAmounts(categoryId, rowId).max),
    items: getDisplayItems(categoryId, options),
    offers: getOffers(categoryId),
  };
}
