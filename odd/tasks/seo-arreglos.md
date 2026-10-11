# Arreglos SEO del sitio público (armalytech.com)

## Objetivo
Corregir los hallazgos de prioridad alta de la auditoría SEO del 2026-10-08 y obtener las métricas que faltaron (Core Web Vitals e indexación) usando Claude en Chrome.

## Problema
- El schema `ElectronicsRepair` tiene un email de relleno (`armalytech@email.com`) que no coincide con el real (`armalycell@gmail.com`): datos NAP inconsistentes.
- Las rutas inexistentes devuelven HTTP 200 sin `noindex` (soft 404).
- `og:image` es relativo (`/armalytech.webp`): WhatsApp y Facebook no muestran la imagen al compartir.
- `/redes` no tiene title, description, canonical ni H1.
- `sameAs` apunta a un link de API de WhatsApp en vez de a perfiles; falta TikTok.
- Typo en `og:title` ("Acessorios") y doble espacio en `og:description`.

## Alcance autorizado
Solo frontend público: `index.html`, `Home.jsx`, `PageError.jsx`, `Redes.jsx`. Sin commits ni push (regla del proyecto).

## Fuera de alcance (pendiente de decisión)
- HTTP 404 real en Vercel/nginx: requiere duplicar la lista de rutas del SPA en `vercel.ts` y nginx. Se resuelve el problema de indexación con `noindex`.
- Contenido de páginas de servicio, redirección de 2 saltos, barra final, fuentes, alt de imágenes, longitudes de title/description.

## TDD
Desactivado (sin configuración de proyecto ni pedido explícito). Verificación funcional: `pnpm build` + inspección del DOM renderizado en el navegador.

## Tareas
- [x] T1 — Schema Home: email real y `sameAs` con Instagram + TikTok. Ruta: inline (1 archivo mecánico).
- [x] T2 — `index.html`: `og:image` absoluto, typo en `og:title`, doble espacio en `og:description`. Ruta: inline.
- [x] T3 — `PageError`: `noindex` + title vía Helmet. Ruta: inline.
- [x] T4 — `/redes`: Helmet (title, description, canonical, og:url) y H1 (`h3` → `h1`, mismo estilo por clase). Ruta: inline.
- [x] T5 — Verificación: build OK y DOM renderizado en preview local.
- [x] T6 — Medición con Claude en Chrome: PageSpeed Insights (mobile/desktop) y Search Console (cobertura).

Ruta: todo inline; ediciones mecánicas pequeñas en 4 archivos ya entendidos (sin investigación ni decisiones de diseño abiertas).

## Criterios de aceptación
- El JSON-LD de la home muestra `armalycell@gmail.com` y `sameAs` sin el link de WhatsApp.
- `og:image` es una URL absoluta.
- Una ruta inexistente renderiza `<meta name="robots" content="noindex">`.
- `/redes` tiene title, description, canonical y un único H1.
- `pnpm build` termina sin errores.

## Progreso y evidencia
- `pnpm build`: OK. `eslint` sobre los 3 JSX tocados: sin errores.
- Preview local (Vite, puerto 5180), DOM renderizado:
  - Home: JSON-LD `email = armalycell@gmail.com`, `sameAs = [instagram, tiktok]`, `og:image` absoluto, `og:title` corregido.
  - `/no-existe-xyz`: title "Página no encontrada | ArmalyTech" y `robots = noindex, follow`. Al volver a `/` con navegación client-side, el meta `robots` desaparece (0 tags).
  - `/redes`: title, description (1 sola), canonical, og:url y un único H1; tamaño visual igual (24px por clase).
- Nota de verificación: Helmet aplica el head con `requestAnimationFrame`; con la pestaña oculta el title queda vacío (falso positivo). Medir con la pestaña pintada.
- Nota de entorno: el launch `frontend-vite` corre Vite desde la raíz del repo y los globs de Tailwind no matchean (faltan utilidades en dev). El build de producción sí las incluye. No es regresión.
- Commits: ninguno (regla del proyecto). Cambios sin commitear en el working tree.

### Mediciones (producción, 2026-10-08)
- PageSpeed mobile: Rendimiento 87, Accesibilidad 100, Prácticas 100, SEO 100. FCP 2,9 s, LCP 3,3 s, TBT 30 ms, CLS 0, SI 2,9 s.
- PageSpeed desktop: Rendimiento 98. FCP 0,7 s, LCP 0,8 s, CLS 0,076.
- CrUX (usuarios reales): sin datos (tráfico insuficiente).
- Imágenes sobredimensionadas (ahorro estimado 3,5 MB): `aboutus.webp` 1,67 MB a 6240×4160 mostrada a 632×421; `faq.webp` 1,38 MB a 6121×4160 mostrada a 735×490; `cta.webp` 363 KB.
- Search Console (propiedad `https://www.armalytech.com/`): 6 indexadas, 4 "Descubierta: actualmente sin indexar" sin rastreo: `/contactanos`, `/redes`, `/servicios/cambio-de-bateria`, `/sobre-nosotros`. Sitemap leído el 30-09-2026, 10 URLs, correcto.
- Rendimiento 3 meses: 324 clics, 23,3 mil impresiones, CTR 1,4 %, posición 5,8. `/precios`: 11.501 impresiones con CTR 0,6 % en posición 5,7. URLs antiguas con impresiones: `/prices`, `/p/precios`.

## Siguiente paso
Desplegar estos cambios y, después, decidir entre: (a) redimensionar `aboutus.webp`/`faq.webp`/`cta.webp`, (b) reescribir title/description de `/precios` para subir CTR, (c) redirecciones 301 de `/prices` y `/p/precios` a `/precios`, (d) solicitar indexación de las 4 URLs sin rastrear.
