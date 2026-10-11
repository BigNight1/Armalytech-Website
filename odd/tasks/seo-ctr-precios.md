# SEO CTR: precios consistentes y titles/descriptions con beneficios concretos

## Objetivo
Subir el CTR orgánico del sitio público (armalytech.com): mostrar los mismos precios en todas partes (Home, carrusel, `/precios`, páginas de servicio, schema) y reescribir `<title>` y meta description de las páginas clave con beneficios concretos (tiempo, precio "desde", garantía, diagnóstico gratis).

## Problema
- Los precios de pantalla y batería se contradecían entre páginas: `/precios` y las páginas de servicio decían pantalla desde S/ 69 y batería desde S/ 97 (y S/ 185 / S/ 125 en las filas de cambio), la home mostraba batería S/ 120 y pantalla S/ 110, y el carrusel de servicios pantalla S/ 120 y batería S/ 115.
- La home y el carrusel mostraban "Precio promedio" y "Desde" con cifras que no salían de `/precios` (agua 150 y 90, parlantes 110, puerto 85, software 45).
- `/precios`: 11.501 impresiones con CTR de 0,6 % en posición 5,7 (Search Console, 3 meses; ver `seo-arreglos.md`). El title y la description no destacaban ningún beneficio.
- Los titles de las páginas de servicio y de la home eran genéricos y terminaban en `| ArmalyTech`.

## Decisiones del dueño
### Ronda 1 (2026-10-09)
- Cambio de pantalla: S/ 90 a S/ 110 según el modelo. Se muestra "Desde S/ 90" y, donde hay espacio, "S/ 90 – S/ 110 según el modelo".
- Cambio de batería: S/ 50 a S/ 90 según el modelo. Se muestra "Desde S/ 50" y, donde hay espacio, "S/ 50 – S/ 90 según el modelo".
- Donde aparezca un precio "desde" de estos dos servicios, el visitante debe ver también que el precio final depende del modelo.
- Filas de tabla que SON el cambio de pantalla o de batería pasan al rango; filas de otros servicios conservan su precio.
- Titles y descriptions aprobados textualmente (Home, Pantalla, Batería, Puerto de carga, Daño por agua, Software, Contacto, Precios).

### Ronda 2 (resolución de las decisiones abiertas)
- D1, mismo día: se elimina la fila "Cambio de batería el mismo día — S/ 159" en todo el sitio. Política para repuestos en general: "¿Lo necesitas el mismo día? Deja un adelanto de la mitad del costo del repuesto, lo traemos del almacén y, cuando llega, instalamos tu repuesto nuevo en menos de 1 hora." Excepción, puerto de carga (zócalos): sin adelanto; "Tenemos zócalos de carga en stock para la mayoría de modelos, así que la reparación se hace al momento." (se mantiene "la mayoría", no "todos").
- D2, canal del diagnóstico: el diagnóstico gratis se puede hacer por WhatsApp o en tienda.
- D3, subservicios de pantalla: "Cambio de cristal completo" pasa a S/ 90 y "Cambio de digitizer" a S/ 140, ambos aproximados ("Precio aproximado: depende del modelo. Escríbenos para cotizar el tuyo.").
- D4, consistencia Home vs `/precios`: todo precio de la Home (tarjetas y carrusel) es "Desde S/ X · según el modelo" con X = el precio más bajo de ese servicio en `pricingData.js`; sin "Precio promedio". Servicios de la Home sin fila en `/precios` usan una fila existente o se agregan.

### Ronda 3 (arreglo y refactor, cero cambio de contenido)
- F1: los enlaces del carrusel deben apuntar a los ids reales de las secciones de `/precios` (la tarjeta de daño por agua apuntaba a `daño-agua` y la sección es `danio-agua`).
- F2: `data/pricingData.js` es la única fuente de montos; todo lo demás (Home, carrusel, `/precios`, páginas de servicio, FAQ, titles/descriptions, JSON-LD, `priceRange`) los lee mediante helpers.

## Alcance autorizado
Solo frontend público. Ronda 1: `Home.jsx`, `RepairsSection.jsx` (+ css), `ServicesPreviewSection.jsx`, `PricingPage.jsx`, `pricingData.js`, las 5 páginas `*Page.jsx` de servicio, `SanBorjaPage.jsx`, `ContactPage.jsx`. Ronda 2 además: `ServicePage.jsx` (prop opcional `priceNotes`), `pricing-hero.css`, `StepsSection.jsx`, `FaqSection.jsx`, `SobreNosotrosPage.jsx`, `Redes/FAQ/faqs.json`. Ronda 3 además: `AdditionalServicesSection.jsx` (lee las filas con los helpers). Sin commits ni push (regla del proyecto).

## Estado del repositorio
Nada está commiteado. El trabajo se hizo sobre el working tree que ya traía ~34 archivos sin commitear del dueño (prerender, páginas de servicio ampliadas, nginx, sitemap). Esta tarea dejó 3 archivos más como modificados (`src/data/pricingData.js`, `src/Components/repairs-section.css`, `src/Components/pricing-hero.css`; el diff total pasó de 34 a 37 archivos) y editó otros que ya formaban parte del WIP (`SanBorjaPage.jsx` es un archivo nuevo sin seguimiento). Rama: `cambiosNuevos`.

## Fuera de alcance
- Panel admin, backend, tickets.
- Tabla de precios por modelo (requiere precios reales por modelo del dueño).
- Cambiar precios de puerto, agua y software más allá de lo que fija D4.
- Quitar los `og:*` estáticos de `index.html` (solo se reporta).
- Commits, push, deploy.

## TDD
Desactivado (sin configuración de proyecto ni pedido explícito). Verificación funcional: `npm run lint`, `npm run build` (incluye prerender), inspección del HTML generado en `dist/` y revisión a 375 px.

## Tareas
- [x] T1 — Precios de pantalla y batería consistentes (home, tarjetas, `/precios`, páginas de servicio, San Borja, JSON-LD, FAQ) con aviso "depende del modelo". Ruta: delegado (un solo writer).
- [x] T2 — Titles, descriptions y og:title/og:description nuevos en las 8 páginas. Ruta: mismo writer.
- [x] T3 — Verificación (lint, build, HTML prerenderizado, grep de precios, revisión a 375 px). Repetida tras la ronda 2.
- [x] T4 — Política de mismo día (D1): fila de S/ 159 eliminada (datos, JSON-LD, lista, FAQ); nota visible bajo la lista de precios y FAQ "¿Pueden cambiarla el mismo día?" en pantalla y batería; nota corta en `/precios`; excepción de zócalos en la página de puerto de carga (nota + FAQ); tiempos reconciliados.
- [x] T5 — Canal del diagnóstico (D2): Home description y textos que decían solo en tienda.
- [x] T6 — Subservicios de pantalla (D3): cristal S/ 90 y digitizer S/ 140 aproximados, en `pricingData.js`, página de pantalla, JSON-LD, lista y FAQ.
- [x] T7 — Consistencia Home / `/precios` (D4): tarjetas y carrusel en formato "Desde S/ X · según el modelo", fila nueva "WiFi y Bluetooth" en `/precios`, `priceRange` recalculado.
- [x] T8 — Ancla del carrusel (F1): cada tarjeta guarda el `categoryId` de la categoría de `pricingData.js` y el ancla sale de `getCategory(categoryId).id`, el mismo `id` que usa `/precios` para la `<section>`. Una tarjeta con un id que no existe rompe el build en vez de fallar en silencio. Ruta: delegado (un solo writer).
- [x] T9 — Fuente única de precios (F2): `pricingData.js` con ids estables de categoría y de fila, `desdeRows` explícito y helpers; páginas de servicio, `/precios`, Home, carrusel, San Borja y JSON-LD leen los montos de ahí. Cero cambio de contenido (HTML idéntico al de antes). Ruta: mismo writer.

## Criterios de aceptación
- Ningún texto visible ni JSON-LD del sitio contiene S/ 97, S/ 120, S/ 125 ni S/ 185, ni "Precio promedio", ni "Cambio de batería el mismo día".
- Cada precio "desde" de la Home y del carrusel coincide con el mínimo de su servicio en `/precios`.
- La política de adelanto aparece en la página de batería, la de pantalla y `/precios`; la excepción de zócalos, en la de puerto de carga (y mencionada en `/precios`).
- `dist/*.html` trae el `<title>` y la meta description nuevos en las 8 páginas.
- `npm run lint` y `npm run build` terminan sin errores.
- Cambiar un monto en `pricingData.js` (y solo ahí) actualiza Home, carrusel, `/precios`, páginas de servicio, FAQ, titles/descriptions y JSON-LD.
- Cada tarjeta del carrusel lleva a una sección que existe en `/precios` (incluida daño por agua).

## Fuente única de precios (T9)
Cabecera de `pricingData.js`: "Única fuente de precios del sitio público: cambia un monto aquí y se actualiza en Home, /precios, páginas de servicio, FAQ y datos estructurados."

- Datos: cada categoría tiene `id` estable (también es el ancla de la sección en `/precios`) y `desdeRows`, la lista explícita de filas que cuentan para el "Desde S/ X" (pantalla: OLED, digitizer y cristal, no calibración; batería: estándar y OEM, no optimización de energía; puerto, agua y software: sus filas de pago, sin el diagnóstico gratis). Cada fila tiene `id` estable y `price`: número, rango `{ min, max }` o `0` (gratis); `desde: true` para "desde S/ 89".
- Helpers exportados: `formatSoles(n)`, `formatPrice(row, { capitalize })` (texto de una fila: "S/ 90", "S/ 90 – S/ 110", "desde S/ 140", "gratis"), `getCategory(id)`, `getRow(categoryId, rowId)` (ambos fallan en build si el id no existe), `getAmounts(categoryId, rowId)` (`{ min, max }`), `getDesde(categoryId, rowId?)`, `getDisplayItems(categoryId, options)`, `getOffers(categoryId)` (Offer / AggregateOffer con `priceCurrency: "PEN"`), `getPriceRange()` (mínimo y máximo de todos los montos de pago) y el atajo `pricingFor(categoryId)` para las páginas de servicio (`desde`, `price(rowId)`, `low(rowId)`, `high(rowId)`, `items`, `offers`).
- Quién lee qué: las 5 páginas de servicio (lista, JSON-LD, texto de opciones, FAQ, title y description); `PricingPage.jsx` y `AdditionalServicesSection.jsx` (filas, y description/og:description con los "desde"); `SanBorjaPage.jsx`; `RepairsSection.jsx` (`getDesde`, incluidas WiFi y parlantes con `getDesde(categoria, fila)`); `ServicesPreviewSection.jsx` (`getDesde` y ancla); `Home.jsx` (`getPriceRange()` en lugar de un literal).
- Lo que no se centraliza (no son montos): los nombres de servicio que se repiten como texto en las listas y FAQ, las frases "precio aproximado: depende del modelo" y el texto de la política de adelanto ("la mitad del costo del repuesto" es una proporción, no un monto), y el prefijo "S/ " que los componentes de la Home escriben delante de un número que sí viene de `getDesde`. Fuera de `pricingData.js` y del admin solo queda una coincidencia de `S/ <número>`: un comentario de ejemplo en `src/ticket/lib/format.js` ("S/ 189.00"), que no tiene relación con estos servicios.

## Cambios de precio
| Dónde | Antes | Ahora |
| --- | --- | --- |
| Home, tarjeta "Pantalla rota" | Desde S/ 110 | Desde S/ 90 · según el modelo |
| Home, tarjeta "Cambio de batería" | Desde S/ 120 | Desde S/ 50 · según el modelo |
| Home, tarjeta "Daño por agua" | Desde S/ 150 | Desde S/ 47 · según el modelo |
| Home, tarjeta "Problemas de WiFi o Bluetooth" | Desde S/ 140 | Desde S/ 140 · según el modelo (ahora con fila en `/precios`) |
| Home, tarjeta "Parlantes dañados" | Desde S/ 110 | Desde S/ 85 · según el modelo (fila "Reparación de parlante y micrófono") |
| Home, aviso bajo el grid (nuevo) | — | "Los precios "desde" son de referencia. El precio final depende del modelo de tu celular." |
| Carrusel, pantalla / batería / puerto / agua / software | Precio promedio: 120 / 115 / 85 / 90 / 45 | Desde S/ 90 / 50 / 38 / 47 / 20 · según el modelo |
| `/precios` y página de pantalla, "Cambio de pantalla OLED" | S/ 185 | S/ 90 – S/ 110 |
| `/precios` y página de pantalla, "Cambio de cristal completo" | S/ 69 | S/ 90 (aproximado) |
| `/precios` y página de pantalla, "Cambio de digitizer" | S/ 138 | S/ 140 (aproximado) |
| `/precios` y página de batería, "Cambio de batería estándar" | S/ 125 | S/ 50 – S/ 90 |
| `/precios` y página de batería, "Batería original (OEM)" | S/ 97 | S/ 50 – S/ 90 |
| `/precios` y página de batería, "Cambio de batería el mismo día" | S/ 159 | fila eliminada (política de adelanto) |
| `/precios`, Servicios adicionales, "WiFi y Bluetooth" | no existía | desde S/ 140 (aproximado) |
| JSON-LD pantalla | OLED Offer 185; digitizer 138; cristal 69 | OLED AggregateOffer 90–110; digitizer 140; cristal 90 |
| JSON-LD batería | estándar 125; OEM 97; mismo día 159 | estándar y OEM AggregateOffer 50–90; sin oferta de mismo día |
| FAQ de pantalla y de batería (y FAQPage JSON-LD) | rangos con S/ 185 / S/ 97 / S/ 125 / S/ 159 | desde S/ 90 (90–110, resto hasta S/ 140) y desde S/ 50 (50–90) |
| `/reparacion-de-celulares-san-borja` | Desde S/ 69 y Desde S/ 97 | Desde S/ 90 (S/ 90 – S/ 110 según el modelo) y Desde S/ 50 (S/ 50 – S/ 90 según el modelo) |
| Home JSON-LD `priceRange` | S/ 30 – S/ 185 | S/ 20 – S/ 159 (mínimo y máximo reales de `pricingData.js`) |

Las filas de OLED, estándar, OEM, cristal, digitizer y WiFi incluyen en su descripción que el precio depende del modelo (y en cristal, digitizer y WiFi, "Precio aproximado: depende del modelo. Escríbenos para cotizar el tuyo."). El aviso general ya existía en `/precios` ("Precios "desde"…") y en `ServicePage.jsx` ("Son precios de referencia…").

## Política de mismo día y excepción de zócalos (T4)
- Texto de la política (idéntico en todos los lugares): "¿Lo necesitas el mismo día? Deja un adelanto de la mitad del costo del repuesto, lo traemos del almacén y, cuando llega, instalamos tu repuesto nuevo en menos de 1 hora."
- Dónde: nota resaltada bajo la lista de precios de `/servicios/reparacion-de-pantalla` y `/servicios/cambio-de-bateria` (nuevo prop `priceNotes` en `ServicePage.jsx`), FAQ "¿Pueden cambiarla el mismo día?" en ambas, y segundo aviso en `/precios`.
- Puerto de carga: nota "Sin adelanto. Tenemos zócalos de carga en stock para la mayoría de modelos, así que la reparación se hace al momento.", FAQ "¿Necesito dejar un adelanto para reparar el puerto de carga?" y la respuesta de "¿Cuánto demora…?" actualizada. `/precios` menciona la excepción.
- Tiempos reconciliados: todo "cerca de 1 hora" pasó a "menos de 1 hora" (página de pantalla: hero y FAQ de duración; `FaqSection.jsx`, `ContactPage.jsx`, `faqs.json`, `SobreNosotrosPage.jsx` incl. FAQPage JSON-LD). "2 a 3 horas" se mantiene como tiempo cuando el repuesto debe traerse del almacén.
- Batería: hero y description del schema ya no dicen "servicio el mismo día disponible" sino "si la necesitas el mismo día, deja un adelanto". Title y meta description no cambian (no contradicen la política).

## Canal del diagnóstico (T5)
- Home description: "Servicio técnico de celulares en San Borja. Pantalla en 2–3 horas, batería el mismo día y 3 meses de garantía. Diagnóstico gratis por WhatsApp o en tienda." (155 caracteres; con "Lima," eran 161, se quitó).
- Textos ajustados a "por WhatsApp o en tienda": `StepsSection.jsx` (paso 2), `SanBorjaPage.jsx` (paso de la visita y FAQ "¿El diagnóstico tiene costo?"), `ContactPage.jsx` ("Diagnóstico gratuito"), `SobreNosotrosPage.jsx` (paso "Diagnóstico").

## Titles y descriptions (T2)
| Página | Title (caracteres) |
| --- | --- |
| Home | Reparación de Celulares en Lima: Diagnóstico Gratis (51) |
| Pantalla | Cambio de Pantalla de Celular en Lima en 2–3 Horas (50) |
| Batería | Cambio de Batería de Celular en Lima el Mismo Día (49) |
| Puerto de carga | Reparación de Puerto de Carga en Lima desde S/ 38 (49) |
| Daño por agua | ¿Celular Mojado? Reparación por Daño de Agua en Lima (52) |
| Software | ¿Celular Lento o con Virus? Reparación de Software en Lima (58) |
| Contacto | Contacto y Ubicación en San Borja \| ArmalyTech (46) |
| Precios | Precios de Reparación de Celulares en Lima (2026) (49) |

`og:title` y `og:description` coinciden con title y description (en Contacto el `og:description` no cambia porque la description tampoco).

## Progreso y evidencia
### Ronda 1
- `npm run lint`: exit 0. `npm run build`: OK, 13 rutas prerenderizadas. Title, description y og:* verificados en `dist/` en las 8 páginas; 375 px sin desborde.

### Ronda 2
- `npm run lint` (desde `frontend/`): exit 0, sin errores ni advertencias.
- `npm run build`: OK, `prerender: 13 routes written, SPA shell at dist/app-shell.html`.
- `dist/servicios/cambio-de-bateria.html`: 0 apariciones de "159" y 0 de "Cambio de batería el mismo día". En `dist/precios.html` los dos S/ 159 son "Retrofit a USB-C" y "Recuperación de datos".
- "Precio promedio": 0 resultados en `dist/**/*.html` y en los bundles `.js`. "cerca de 1 hora": 0 resultados.
- Frase de adelanto: batería (nota + FAQ visible + FAQPage JSON-LD), pantalla (nota + FAQ visible + FAQPage JSON-LD) y `/precios` (aviso). Frase de zócalos: página de puerto de carga (nota, FAQ de duración visible y en JSON-LD, FAQ de adelanto) y `/precios`.
- `dist/index.html`: "Diagnóstico gratis por WhatsApp o en tienda." en `description` y `og:description`.
- Home vs `/precios` (script sobre `dist/index.html` y `dist/precios.html`):

| Sección | Servicio de la Home | Home "Desde" | Mínimo del servicio en `/precios` | Mínimo de toda la categoría | Coincide |
| --- | --- | --- | --- | --- | --- |
| Tarjetas | Pantalla rota | S/ 90 | S/ 90 (OLED, cristal, digitizer) | S/ 47 (calibración) | sí |
| Tarjetas | Cambio de batería | S/ 50 | S/ 50 (estándar, OEM) | S/ 38 (optimización de energía) | sí |
| Tarjetas | Daño por agua | S/ 47 | S/ 47 (categoría completa) | S/ 47 | sí |
| Tarjetas | Problemas de WiFi o Bluetooth | S/ 140 | S/ 140 (fila nueva "WiFi y Bluetooth") | sin categoría propia | sí |
| Tarjetas | Parlantes dañados | S/ 85 | S/ 85 ("Reparación de parlante y micrófono") | S/ 47 (agua) | sí |
| Carrusel | Reparación de pantalla | S/ 90 | S/ 90 | S/ 47 | sí |
| Carrusel | Cambio de batería | S/ 50 | S/ 50 | S/ 38 | sí |
| Carrusel | Puerto de carga | S/ 38 | S/ 38 (categoría completa) | S/ 38 | sí |
| Carrusel | Daño por agua | S/ 47 | S/ 47 (categoría completa) | S/ 47 | sí |
| Carrusel | Problemas de software | S/ 20 | S/ 20 (categoría completa) | S/ 20 | sí |

- `priceRange` calculado con un script sobre `pricingData.js` (todas las cifras en soles): mínimo 20, máximo 159, igual que el valor escrito en `Home.jsx`.
- Navegador (build servido en local y detenido después): a 375 px `/precios` (también a 660 px), la página de pantalla y la home sin desborde horizontal; la fila "WiFi y Bluetooth" cabe; la nota del mismo día se ve bajo la lista de precios.
- Commits: ninguno (regla del proyecto).

### Ronda 3 (F1 + F2)
- Línea base: `npm run build` y copia de `dist/` fuera del repo antes de tocar nada (eliminada al final).
- `npm run lint`: exit 0. `npm run build`: OK, `prerender: 13 routes written`; los tamaños en bytes de las 13 rutas son idénticos a los de la ronda 2.
- Comparación `dist/` nuevo contra la línea base, normalizando los marcadores `<!-- -->` de React, los espacios y los nombres con hash de los assets: los 14 `.html` (13 rutas + `app-shell.html`) salen idénticos en HTML completo, texto visible, `<head>` (title, meta description, og:*) y JSON-LD: 0 diferencias. Comparación byte a byte tras enmascarar solo el hash de los assets: 0 diferencias. El hash del bundle principal sí cambia (el JS cambió, el contenido no).
- El ancla del carrusel va en el estado del router, no en el HTML, así que se comprobó en el navegador con los bundles servidos en local. Al pulsar "Ver precios" en cada tarjeta, la página hace scroll a la sección con el id esperado. Línea base: `reparacion-pantalla`, `cambio-bateria`, `puerto-carga` y `software` bien; daño por agua sin scroll (el id `danio-agua` no se encontraba). Build nuevo: las 5 llegan (`reparacion-pantalla`, `cambio-bateria`, `puerto-carga`, `danio-agua`, `software`). El bundle sigue mostrando los 5 precios del carrusel: 90 / 50 / 38 / 47 / 20.
- Prueba de que la fuente es única: se cambió "Limpieza de puerto de carga" de 38 a 39 solo en `pricingData.js` y se reconstruyó. En `dist/`: title, meta description y og:title/og:description de la página de puerto de carga con "desde S/ 39"; fila de la lista, JSON-LD (`"price":"39"`), viñeta de opciones y FAQ (visible y FAQPage JSON-LD) con S/ 39 (0 apariciones de S/ 38 en esa página); `/precios` con la fila Limpieza en S/ 39 y la description y og:description con "Puerto de carga desde S/ 39"; tarjeta "Puerto de carga" del carrusel de la Home en S/ 39; `/reparacion-de-celulares-san-borja` con "Desde S/ 39". Los S/ 38 que quedan en `dist/` son "Optimización de energía" (otra fila de batería). Se revirtió a 38, se reconstruyó y el `dist/` volvió a ser idéntico a la línea base (14 `.html`, 0 diferencias).
- `grep -rnE "S/ ?[0-9]" frontend/src --include=*.jsx --include=*.js` sin `src/admin` ni `pricingData.js`: una sola coincidencia, el comentario de ejemplo `"S/ 189.00"` de `src/ticket/lib/format.js` (no es un monto de estos servicios).
- Commits: ninguno (regla del proyecto).

## Decisiones abiertas para el dueño
Resueltas en la ronda 2: la fila de S/ 159 del mismo día, el cristal a S/ 69, las cifras sueltas de la Home y del carrusel, el `priceRange`, el canal del diagnóstico. Resueltas en la ronda 3: el enlace del carrusel de daño por agua y los precios repetidos a mano en cuatro lugares.

1. **Alcance de "desde" en pantalla y batería (interpretación para D4).** La Home muestra "Desde S/ 90" y "Desde S/ 50": el mínimo de las filas que SON el cambio de pantalla (OLED, cristal, digitizer) y de batería (estándar, OEM). El mínimo de toda la categoría es más bajo (calibración S/ 47; optimización de energía S/ 38), pero son otros servicios y contradirían los S/ 90 y S/ 50 que fijó el dueño. Confirmar la lectura.
2. **Fila "Cambio de pantalla OLED" (antes S/ 185).** Se trató como el cambio de pantalla en sí (S/ 90 – S/ 110). Confirmar que ya no existe un precio OLED premium.
3. **Estándar y OEM con el mismo rango** (S/ 50 – S/ 90). Confirmar si se quieren rangos distintos.
4. **Tarjetas de la Home con descripción más estrecha que la fila que fija el precio.** "Daño por agua" (descripción "limpieza y secado") muestra S/ 47, el mínimo de la categoría ("Tratamiento de corrosión"); el secado cuesta S/ 88. "Parlantes dañados" usa "Reparación de parlante y micrófono — S/ 85", cuya descripción habla de daño por agua. "Problemas de software" muestra S/ 20 ("Comprobación de compatibilidad") aunque el diagnóstico es gratis, y "según el modelo" no encaja del todo en software. Confirmar o ajustar.
5. **WiFi y Bluetooth** se agregó como "WiFi y Bluetooth — desde S/ 140" en Servicios adicionales de `/precios` (nombre corto para que quepa a 375 px). No hay página de servicio donde encaje. El S/ 140 es el precio que la Home ya mostraba.
6. **Frases que el copy apoya solo en parte:**
   - "Pantalla en 2 a 3 horas": apoyado. Con adelanto, la instalación toma menos de 1 hora una vez que llega el repuesto.
   - "Desde S/ 47" en daño por agua: apoyado por "Tratamiento de corrosión", pero la frase "Secado, …, recuperación de datos desde S/ 47" suena a que todo parte de S/ 47 (secado S/ 88, recuperación de datos S/ 159).
   - "3 meses de garantía": apoyado; aplica al repuesto cambiado cuando falla por sí solo.
   - "(2026)" en el title de `/precios`: año fijo.
   - Meta description de software (texto aprobado): "Lo diagnosticamos gratis en San Borja" no menciona WhatsApp; se dejó textual.
7. **Los titles nuevos ya no llevan "| ArmalyTech"** (salvo Contacto).
8. **`og:*` estáticos de `index.html`**: las 13 rutas prerenderizadas definen su propio `og:title` por Helmet y el prerender quita el del template, así que no hay duplicado en `dist/*.html`. Quedan solo en `dist/app-shell.html`. Excepción: `/redes` y `/privacidad` no definen `og:description` y heredan el genérico del template ("…venta de accesorios… repuestos originales", afirmación sin confirmar). Sin cambios.
9. **Inconsistencias previas que no se tocaron:** `FaqSection.jsx` ("¿El diagnóstico tiene costo? En muchos casos es gratuito…") y `CtaSection.jsx` ("Evaluación sin costo en muchos casos.") contradicen el "diagnóstico gratis" del resto del sitio.
10. **Cambiar un precio ahora es un solo cambio**, en `pricingData.js`. Para que un servicio nuevo cuente en el "Desde" de su categoría hay que añadirlo a `desdeRows`; si un servicio nuevo no debe bajarlo, se deja fuera.

## Siguiente paso
Revisión del dueño de las decisiones abiertas 1 a 5; después, commit y deploy (acciones del dueño). Tras el deploy, pedir inspección/indexación de `/precios` y de las páginas de servicio en Search Console y medir el CTR a 28 días contra la línea base (CTR 0,6 % en `/precios`).
