# Mejoras SEO a partir del análisis de competencia

## Objetivo
Implementar en el código del sitio público las mejoras priorizadas del informe `reports/Competencia reparación celulares Lima.md` que no dependen de datos externos del negocio ni del módulo de tickets.

## Problema
- La dirección del sitio y del schema (`Av. San Luis 1859`) no coincide con la ficha de Google e Instagram. El dueño confirmó la correcta: **Av. San Luis 1873, Tienda 127** (MultiMercado San Borja).
  - **Actualización 2026-10-25 (decisión del dueño):** la dirección correcta es **Av. San Luis 1849-1851**.
    Reemplaza al 1873 que se usó en esta tanda y al 1859 anterior. Se unificó en todo el producto, incluidos
    la página pública del ticket y el comprobante (que en esta tanda quedaron fuera de alcance). Ver
    [seguridad-hardening-2026-10-25.md](seguridad-hardening-2026-10-25.md), C8.
- No existe una página de garantía con plazo, cobertura y exclusiones; los textos actuales se contradicen (Contacto: 14 días de reevaluación + 3 meses en repuestos; FAQ de `/redes`: 3 meses en todas las reparaciones).
- `/precios` tiene 11.501 impresiones y CTR de 0,6 % (Search Console, 3 meses).
- Las páginas de servicio son delgadas (~100–150 palabras propias) y 4 URLs están "Descubierta: actualmente sin indexar".
- El sitio es una SPA: el HTML inicial no tiene contenido (shell de ~3,3 KB).
- Imágenes sobredimensionadas (`aboutus.webp` 1,67 MB, `faq.webp` 1,38 MB, `cta.webp` 363 KB) y LCP móvil de 3,3 s.
- URLs antiguas (`/prices`, `/p/precios`) con impresiones y sin redirección; `/precios/` con barra final responde 200.

## Reglas de garantía confirmadas por el dueño
- Cubre: fallas que aparecen solas, sin causa externa ("dejó de funcionar de la nada", falla natural del componente reparado o del repuesto).
- No cubre: equipo roto, golpeado o caído después de la entrega, contacto con agua o líquidos, mal uso o manipulación por terceros.
- Plazo: se usan los plazos ya publicados en Contacto (14 días de reevaluación sin costo + 3 meses contra defectos de fábrica del repuesto) **pendiente de confirmación del dueño**.

## Alcance autorizado
Frontend público (`frontend/`): contenido, schema, páginas nuevas (`/garantia`, página de zona San Borja), prerender, redirecciones en `vercel.ts` y nginx, imágenes, fuentes, sitemap.

## Fuera de alcance
- Todo lo relacionado con tickets (`src/ticket/**`, `/consultar-ticket`, `/ticket/*`, `TicketContact.jsx`), aunque `TicketContact.jsx` aún muestra la dirección 1859.
- Panel admin.
- Libro de Reclamaciones, RUC y razón social (requieren datos del negocio y validación legal).
- Tabla de precios por modelo y niveles de repuesto (requieren precios reales del negocio).
- Medios de pago y tiempos de reparación nuevos (requieren confirmación del negocio).
- Redirección de 2 saltos `http://armalytech.com` → `https://armalytech.com` → `www` (se configura en el panel de dominios de Vercel).
- Ficha de Google, reseñas, redes sociales y video.
- Commits y push (regla del proyecto).

## TDD
Desactivado (sin configuración del proyecto ni pedido explícito). Verificación funcional: `pnpm build`, `eslint` sobre archivos tocados, inspección del HTML generado en `dist/` y del DOM renderizado.

## Estrategia de entrega
El total supera ~400 líneas. Como el proyecto prohíbe commits sin pedido explícito, no hay work-unit commits ni PR encadenados: todo queda en el working tree para revisión del dueño.

## Tareas
- [x] T1 — Dirección (NAP): reemplazar 1859 por "Av. San Luis 1873, Tienda 127" en textos, schema y metas del sitio público (excepto tickets). Ruta: delegado (writer A), varios archivos.
- [x] T2 — Página `/garantia` con cobertura, exclusiones y plazos; unificar textos de garantía (Contacto, FAQ, faqs.json, Hero, Footer) y enlazarla. Ruta: writer A.
- [x] T3 — `/precios`: nuevo title/description con cifras y aclaración de a qué aplica el "desde". Ruta: writer A.
- [x] T4 — Imágenes (`aboutus.webp`, `faq.webp`, `cta.webp`) redimensionadas, `alt` faltantes, recorte de familias de fuentes sin uso, `lastmod` en sitemap y nuevas URLs. Ruta: writer A.
- [ ] T5 — Páginas de servicio de 600–1.000 palabras (proceso, síntomas, garantía, FAQ con schema FAQPage) y enlace a `/servicios/problemas-de-software` desde la home. Ruta: delegado (writer B).
- [ ] T6 — Página de zona San Borja con contenido propio (no duplicado de Contacto). Ruta: writer B.
- [ ] T7 — Prerender estático de las rutas públicas en el build, `cleanUrls`/`trailingSlash` en Vercel, `try_files` en nginx, 301 de `/prices` y `/p/precios` a `/precios`. Ruta: delegado (writer C), al final para incluir las rutas nuevas.
- [ ] T8 — Verificación integral: build, HTML prerenderizado por ruta, DOM en navegador, sin errores de consola nuevos.

## Criterios de aceptación
- Ningún archivo público (fuera de tickets) contiene "1859".
- `/garantia` existe, está en el sitemap y enlazada desde Footer y Contacto; los textos de garantía no se contradicen.
- Cada página de servicio tiene 600–1.000 palabras de contenido propio, sin datos inventados.
- `dist/` contiene HTML prerenderizado con `<title>`, meta description, canonical y el contenido de cada ruta pública.
- `/prices` y `/p/precios` redirigen con 301 a `/precios`; `/precios/` redirige a `/precios`.
- `pnpm build` termina sin errores.

## Progreso y evidencia
### T1–T4 (writer A)
- `pnpm build`: OK. `eslint` sobre 15 JSX tocados: sin errores.
- `rg "1859"` (verificado por el orquestador): solo quedan `src/ticket/components/TicketContact.jsx` y `src/admin/tickets/components/TicketDetailDrawer.jsx` (fuera de alcance) y coordenadas de embeds de Google Maps ("1859796", no es la dirección).
- `/garantia` creada (`WarrantyPage.jsx`) con FAQPage JSON-LD; enlazada desde Footer, Hero y Contacto; en el sitemap. Textos de garantía unificados en FaqSection, SobreNosotros (y su JSON-LD), CtaSection, Contacto y `faqs.json`.
- `/precios`: title "Precios de reparación de celulares desde S/ 69 | ArmalyTech" (59) y description de 146 caracteres con cifras de `pricingData.js`; nota "desde" reescrita.
- Imágenes: `aboutus.webp` 1.713.100 → 112.098 B; `faq.webp` 1.409.530 → 127.306 B; `cta.webp` 372.090 → 96.074 B (verificado por el orquestador).
- Fuentes: eliminadas Open Sans y Poppins (sin uso), Plus Jakarta solo vía `redes.css`, Nunito recortada a 600/700/800.
- Sitemap: `lastmod` en las 12 URLs.
- Inconsistencias detectadas fuera de alcance: tiempos de reparación contradictorios (`faqs.json` "1 y 2 horas", Contacto "1–2 días", FaqSection "mismo día o 24–48 horas"); `faqs.json` afirma "repuestos originales" y "todas las marcas" sin confirmar.

### T5–T6 (writer B)
- `ServicePage.jsx` acepta `sections`, `faqs` y `related`; FAQPage JSON-LD generado desde el mismo array visible.
- Palabras (hero + secciones + FAQ): pantalla 998, batería 991, puerto 959, agua 993, software 970. Página de zona ~676.
- `/reparacion-de-celulares-san-borja` creada (`ZonePage/SanBorjaPage.jsx`), enlazada desde Footer y Contacto, en el sitemap.
- `/servicios/problemas-de-software` enlazada desde el Footer (ahí viven los otros 4 enlaces de servicio de la home).
- `pnpm build` OK; eslint sin errores.
- Pendientes de confirmar por el dueño: cómo aplica la garantía en software (no instala repuestos) y en daño por agua; horario en `ContactSection.jsx` ("Lun–Sáb 9AM – 7PM") contradice 10:00–20:00 del resto del sitio.

### T7 (writer C)
- `src/entry-server.jsx` + `scripts/prerender.mjs` (build SSR con la API programática de Vite, `ssr.noExternal: true`; sin dependencias nuevas). Rutas leídas de `dist/sitemap.xml`.
- `build` = `vite build && node scripts/prerender.mjs`; `build:spa` = solo Vite. `dist/app-shell.html` es el fallback SPA para rutas no prerenderizadas (admin, tickets, registro, 404).
- `main.jsx`: `hydrateRoot` si `#root` tiene contenido, si no `createRoot`.
- `vercel.ts`: `cleanUrls: true`, `trailingSlash: false`, fallback a `/app-shell`, 301 de `/prices` y `/p/precios` a `/precios`. Precedencia filesystem > rewrites según https://vercel.com/docs/project-configuration/vercel-json (no probado en un deploy real).
- nginx: `try_files $uri $uri.html /app-shell.html`, 301 de URLs viejas y de barra final; no ejecutado (sin nginx local).
- Verificado por el orquestador: `pnpm build` genera 13 rutas con 1 title, 1 description, 1 canonical y H1 cada una.
- Mismatch de hidratación encontrado en navegador (React #425/#418/#423 en rutas distintas de la home). Causa raíz: `react-whatsapp-widget` renderiza la hora actual (HH:MM) durante el render, así que el HTML prerenderizado llevaba la hora del build. Corrección en `src/App.jsx`: el widget se monta solo después de la hidratación (`isMounted` con `useEffect`). Es un overlay fijo, sin cambio de layout.

### T8 — Verificación integral (orquestador)
- `pnpm build`: OK, 13 rutas prerenderizadas + `dist/app-shell.html`.
- Chrome (pestaña nueva, `dist` servido con `serve@14`): las 13 rutas cargan sin mensajes de consola; `#root` hidratado (`__reactContainer`), 1 `<title>`, 1 H1 y widget de WhatsApp presente tras el montaje.
- Móvil 375 px: `/servicios/problemas-de-software`, `/garantia` y la página de zona sin desborde horizontal (`scrollWidth = clientWidth = 375`).
- Advertencia preexistente sin tocar: `Hero.jsx:60` usa `fetchPriority` (React 18 prefiere `fetchpriority`).
- No verificado: comportamiento real en Vercel (precedencia filesystem/rewrites, 301) ni nginx (no hay nginx local). Validar tras el próximo deploy.
- Diff: 34 archivos modificados (+964/−68) más archivos nuevos (`WarrantyPage`, `ZonePage`, `entry-server.jsx`, `scripts/prerender.mjs`). Sin commits.

- [x] T5, T6, T7, T8 completas.

## Confirmaciones del dueño (2026-10-08, segunda ronda)
- Horario: lunes a sábado, 10:00 – 20:00 (formato 24 h en todo el sitio).
- Tiempos: puerto de carga (zócalo) 1 a 2 horas; cambio de pantalla 2 a 3 horas cuando hay que traer la pantalla del almacén, o alrededor de 1 hora si el cliente deja un adelanto y la pantalla se trae antes; el resto depende de la complejidad y se confirma tras el diagnóstico.
- Garantía: 3 meses sobre el repuesto cambiado si falla por sí solo. No cubre roto/golpeado/caído, agua o líquidos, mal uso. Se elimina el término "14 días de reevaluación" (no confirmado por el dueño).

- [x] T9 — Unificar horario, tiempos de reparación y garantía (3 meses) en todo el sitio público (sin tickets/admin) y regenerar el prerender. Ruta: delegado (writer D). **Verificado de forma independiente (evidencia en H1).**

### T9 — Lo que reportó el writer D (verificado por el orquestador en H1)
- Horario: "Lun–Sáb 10:00 – 20:00" en `Location.jsx`, `ContactSection.jsx`, `ContactPage.jsx` (constante, meta y og:description) y `WarrantyPage.jsx`. Servicios y `SanBorjaPage` ya decían "lunes a sábado de 10:00 a 20:00".
- Tiempos: "El puerto de carga toma de 1 a 2 horas y el cambio de pantalla de 2 a 3 horas; si dejas un adelanto, la pantalla se trae antes y el cambio toma cerca de 1 hora. En el resto de servicios, confirmamos el tiempo después del diagnóstico gratuito." en `faqs.json`, `FaqSection.jsx`, `ContactPage.jsx`, `CtaSection.jsx` y `SobreNosotrosPage.jsx` (FAQ + JSON-LD). FAQ "¿Cuánto demora…?" añadida en pantalla, puerto, software y daño por agua.
- Garantía: "El repuesto que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. No cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros." en `FaqSection.jsx`, `SobreNosotrosPage.jsx`, `faqs.json`, `SanBorjaPage.jsx`, `ContactPage.jsx`, `WarrantyPage.jsx` y las 5 páginas de servicio (software y agua: la garantía aplica a las piezas que se reemplacen durante el servicio).
- Eliminado "14 días de reevaluación" en todo el sitio público.
- Reportado: `pnpm build` OK (13 rutas), eslint sin errores, palabras por página de servicio entre 978 y 990.
- Se mantiene a propósito: la opción con precio "Cambio de batería el mismo día" y "Servicio el mismo día disponible" en `CambioBateriaPage.jsx` y `pricingData.js`.

## Traspaso: trabajo pendiente para otra IA

Instrucciones para quien continúe. Leer primero este documento completo y `reports/Competencia reparación celulares Lima.md`.

### Reglas obligatorias
- **No hacer `git commit`, `git push`, `merge`, `rebase`, `reset` ni `stash`** salvo pedido explícito del dueño en ese mensaje (ver `.claude/CLAUDE.md`). Dejar los cambios en el working tree.
- **No tocar nada de tickets** (`frontend/src/ticket/**`, `TicketContact.jsx`, rutas `/ticket`, `/consultar-ticket`) ni el panel admin (`frontend/src/admin/**`) hasta que el dueño lo pida.
- **No inventar datos del negocio.** Solo usar los hechos confirmados en este documento (dirección, horario, tiempos, garantía, precios ya publicados).
- Textos visibles en español neutro con "tú"; comentarios de código en inglés. Respetar los finales de línea existentes (varios archivos son CRLF).
- El sitio se prerenderiza y se hidrata: nada que dependa de hora, fecha, locale o `window` durante el render (ver el caso del widget de WhatsApp en T7).
- Documentos y reportes en español.

### Cómo probar
- Build completo: `cd frontend && pnpm build` → debe terminar con `prerender: 13 routes written, SPA shell at dist/app-shell.html`.
- Servir el build: configuración `frontend-dist` en `.claude/launch.json` (`npx serve@14 frontend/dist -l 4180`).
- Hidratación: abrir cada ruta en una pestaña nueva y confirmar que la consola no muestra errores React #418/#423/#425 y que `#root` tiene una clave `__reactContainer…`.
- Ojo: con la pestaña del navegador oculta, Helmet no actualiza el `<title>` (usa `requestAnimationFrame`); medir con la pestaña visible.

### H1 — Verificación de T9 (completada 2026-10-08)
1. `rg -n -i "14 d[ií]as|reevaluaci|9AM|7PM|10AM|8PM|24[–-]48|1[–-]2 d[ií]as|entre 1 y 2 horas|1859" frontend/src` → **sin resultados de texto prohibido**. Solo aparecen `TicketContact.jsx:22` y `admin/tickets/TicketDetailDrawer.jsx:1106` (dirección 1859, fuera de alcance) y las coordenadas de los embeds de Google Maps (`...1859796...`, falso positivo).
2. `pnpm build` → OK, `prerender: 13 routes written, SPA shell at dist/app-shell.html`.
3. HTML prerenderizado: `dist/contactanos.html` contiene `Lun–Sáb 10:00 – 20:00`; `dist/servicios/reparacion-de-pantalla.html` contiene `cerca de 1 hora`; **`3 meses` presente en `dist/garantia.html` y en las 5 páginas de servicio**. Barrido de todo `dist/**.html`: ningún `14 días`, `reevaluación`, `9AM`, `7PM`, `30 días`, `24-48` ni `entre 1 y 2 horas`.
4. FAQPage JSON-LD vs FAQ visible: **8 páginas con FAQPage (43 preguntas en total), 0 discrepancias** (garantía 5, zona San Borja 5, sobre-nosotros 8, y 6 en cada una de las 5 páginas de servicio).
5. Hidratación (paso 4 del plan original): **no re-ejecutada en navegador**. Se verificó de forma estática la causa raíz conocida — `App.jsx:111` monta el widget de WhatsApp solo tras la hidratación (`isMounted`) y el HTML prerenderizado no contiene el widget ni horas de reloj. T9 fue reemplazo de texto, sin código dependiente de hora/locale/window. Queda pendiente una pasada en navegador para cerrarlo al 100 %.

- **T9 marcada como `[x]`** con esta evidencia.

### H1b — Hallazgos nuevos de la verificación (para H3)
- **Contradicción de garantía en el comprobante impreso:** `TicketDetailDrawer.jsx:1177` imprime *"Garantía: 30 días sobre la pieza cambiada"*, mientras todo el sitio público ya dice **3 meses**. El cliente recibe por escrito un plazo distinto al publicado. Está en admin/tickets (fuera del alcance de T9), pero es la misma garantía.
- **`dist/app-shell.html` es indexable:** no tiene `noindex` (confirmado en el HTML generado) y `vercel.ts` no define `headers`, así que `/app-shell` sigue siendo accesible con el title genérico "Armalytech · Servicio Técnico y Accesorios". Es el punto H3-1, ahora confirmado como real.
- **Riesgo de hidratación latente por el año del pie:** `Footer.jsx:112` usa `new Date().getFullYear()` durante el render. El HTML prerenderizado queda con `© 2026`; si el sitio no se reconstruye, el 1 de enero el cliente renderizaría otro año y React avisaría de mismatch (#418/#423) en todas las páginas. Además el año mostrado queda viejo sin rebuild.
- **`/resena` no existe:** `grep` sobre `frontend/src` no encuentra la ruta, aunque los ADR 0026/0027 la usan como destino del pedido de reseña. Ver `odd/tasks/envio-tickets-whatsapp.md`.

### H2 — Después del deploy (requiere que el dueño despliegue)
1. Comprobar en producción: `curl -sI https://www.armalytech.com/prices` y `/p/precios` → 301 a `/precios`; `/precios/` → redirección a `/precios`; `/precios.html` → redirección a `/precios`; `/precios` → 200 con el HTML prerenderizado (no el shell vacío).
2. Comprobar que una ruta SPA no prerenderizada (por ejemplo `/consultar-ticket`) sigue funcionando (sirve `app-shell.html`).
3. Si se usa el despliegue Docker/nginx: probar `frontend/nginx/default.conf.template` (no se pudo ejecutar localmente).
4. Search Console (propiedad `https://www.armalytech.com/`): Inspección de URL y "Solicitar indexación" para `/contactanos`, `/redes`, `/servicios/cambio-de-bateria`, `/sobre-nosotros`, `/garantia` y `/reparacion-de-celulares-san-borja`. Es una acción en la cuenta del dueño: pedir permiso antes.
5. Repetir PageSpeed Insights (móvil) y comparar con la línea base: rendimiento 87, LCP 3,3 s.

### H3 — Mejoras de código pendientes (prioridad media/baja)
- `dist/app-shell.html` es accesible en `/app-shell` y no tiene `noindex` (**confirmado** en el HTML generado): añadir `X-Robots-Tag: noindex` para esa ruta en `vercel.ts` (headers) y en nginx. `vercel.ts` hoy no define `headers`.
- `frontend/src/Components/Footer.jsx:112` calcula el año con `new Date().getFullYear()` en el render: el HTML prerenderizado queda con el año del build. Moverlo a un valor calculado tras el montaje (como el widget en `App.jsx`) o a una constante actualizada por el build.
- nginx: redirigir `/<ruta>.html` → `/<ruta>` (Vercel ya lo hace con `cleanUrls`).
- `frontend/src/Components/Hero.jsx:60`: `fetchPriority` genera una advertencia en React 18; usar el atributo en minúscula (`fetchpriority`) o la forma compatible.
- `frontend/src/Components/Redes/redes.css` importa Plus Jakarta Sans con `@import`, y eso la carga en todas las páginas; evaluar cargarla solo donde se usa o reemplazarla.
- `Location.jsx` **confirmado como componente muerto**: solo se referencia a sí mismo (`grep` sobre `frontend/src` no encuentra ningún import). Eliminar.
- La fila 5 del informe (tabla de precios por modelo con tipo de repuesto, tiempo y garantía) requiere precios reales por modelo del dueño: no inventar.
- Filas 17–18 del informe (guías de síntomas y páginas por modelo): ya hay prerender, así que se pueden hacer, pero solo con datos confirmados por el dueño.

### H4 — Requiere datos o decisión del dueño (no implementar sin ellos)
- Dirección vieja (1859) en `TicketContact.jsx` y en admin `TicketDetailDrawer.jsx`: actualizar a "Av. San Luis 1873, Tienda 127" cuando el dueño habilite cambios en tickets.
- Libro de Reclamaciones virtual, RUC y razón social en el pie del sitio: necesitan los datos del negocio y validación legal (INDECOPI, Ley 32495).
- Redirección de 2 saltos `http://armalytech.com` → `https://armalytech.com` → `www`: se configura en el panel de dominios de Vercel.
- Ficha de Google: corregir/confirmar la dirección, subir fotos, agregar servicios y pedir reseñas (fuera del código).

## Pendientes para el dueño
- Ninguno de garantía, horario ni tiempos: confirmados en la segunda ronda.
- Ver H2 (deploy y Search Console) y H4.

## Siguiente paso
T1–T9 verificadas. Falta: (1) una pasada de hidratación en navegador para cerrar H1 al 100 %; (2)
decisión del dueño sobre H3 (empezando por el `noindex` de `/app-shell` y el año del pie); (3)
revisión del dueño, commit y deploy, y después H2.
