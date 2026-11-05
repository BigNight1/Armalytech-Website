# SEO auditoría de noviembre: 404 reales, noindex privado, /precios y datos estructurados

## Objetivo
Cerrar los hallazgos de la auditoría SEO del 2026-11-04 en el sitio público (armalytech.com): rutas inexistentes con HTTP 404 real, superficies privadas con `X-Robots-Tag: noindex`, title y description de `/precios` que respondan "cuánto cuesta", datos estructurados más completos, alt de imágenes, enlaces internos hacia páginas que Google no rastrea y precarga del LCP de la home.

## Problema
- Cualquier URL inventada (`/pagina-que-no-existe-xyz`, `/login`, `/panel`) devolvía 200 con el shell genérico, sin canonical ni robots.
- `/precios`: 13,4 mil impresiones, posición 5,6, CTR 0,5 %. Consultas principales: "cuánto cuesta un cambio de pantalla de celular", "cuánto cuesta cambiar la pantalla de un celular", "cuánto cuesta arreglar la pantalla de un celular".
- `/contactanos`, `/garantia`, `/redes` y `/privacidad` están descubiertas pero Google no las rastrea.
- Imágenes con `alt=""` en componentes compartidos (footer y menú móvil): 10 en la home, 6 en el resto.
- Producción parece servirse desde Vercel (`Server: Vercel`) aunque `DEPLOY.md` da Dokploy/nginx como vigente: todo cambio de enrutamiento debe funcionar en ambos.

## Alcance autorizado
Solo `frontend/` (público, `vercel.ts`, plantilla nginx, prerender, sitemap) y documentación (`DEPLOY.md`, este archivo). Sin commits ni push (regla del proyecto), sin deploy, sin dependencias nuevas.

## Fuera de alcance
- Panel admin, backend, e2e.
- Perfiles de Facebook y LinkedIn en `sameAs` y `aggregateRating` (no hay URLs ni reseñas verificables en el código).
- Prerenderizar `/consultar-ticket` o agregarla al sitemap.

## TDD
Desactivado (sin configuración de proyecto ni pedido explícito). Verificación funcional: `pnpm lint`, `pnpm build` (incluye prerender), inspección de `dist/` y `e2e`.

## Rutas cliente reales (`frontend/src/App.jsx`)
- Prerenderizadas (12, en `sitemap.xml`): `/`, `/precios`, `/sobre-nosotros`, `/contactanos`, `/garantia`, `/privacidad`, `/reparacion-de-celulares-san-borja`, `/redes`, `/servicios/{reparacion-de-pantalla,cambio-de-bateria,reparacion-puerto-de-carga,restauracion-dano-de-agua,problemas-de-software}`.
- Solo cliente (shell, HTTP 200): `/admin` y `/admin/*`, `/ticket` y `/ticket/:token`, `/consultar-ticket`, `/registrar/usuario`.
- Todo lo demás: `PageError` (`*`) -> `dist/404.html` con HTTP 404.

## Decisiones
- **/consultar-ticket queda indexable.** Es una página pública enlazada desde la navegación y el footer, y el código no indica lo contrario. Sí lleva `noindex` `/admin/*`, `/ticket` y `/ticket/*` (enlaces opacos por ticket) y `/registrar/*`. No se bloquean en `robots.txt` para que el rastreador vea el `noindex`.
- **No hay ADR nuevo ni "Actualización"**: no cambió ninguna decisión de producto, datos o seguridad; es implementación de enrutamiento y SEO. La discrepancia Vercel/Dokploy queda como pregunta abierta en `DEPLOY.md` §5.
- **Sin catch-all.** Vercel: se quitó el rewrite `/((?!api/).*)` y se enumeran las rutas solo-cliente; lo no encontrado cae al `404.html` estático con 404. nginx: `try_files $uri $uri.html =404` + `error_page 404 /404.html`; `app-shell.html` es `internal`.

## Tareas
- [x] T1 — 404 reales: `scripts/prerender.mjs` escribe `dist/404.html` (noindex, sin canonical, falla el build si no); `vercel.ts` y nginx con la lista de rutas solo-cliente. Ruta: delegado (un solo writer).
- [x] T2 — `X-Robots-Tag: noindex` para `/admin`, `/admin/*`, `/ticket`, `/ticket/*`, `/registrar/*` en `vercel.ts` y nginx (con los headers de seguridad repetidos en cada `location`).
- [x] T3 — `/precios`: title, description y H1 nuevos con precios de `pricingData.js`; `/sobre-nosotros` acortados.
- [x] T4 — JSON-LD: `hasMap` en la home; `BreadcrumbList` en `/precios` y las 5 páginas de servicio (`ServicePage.jsx`). Sin `FAQPage` en `/precios` (no hay FAQ visible).
- [x] T5 — Alt de imágenes: iconos sociales del footer y del menú móvil, logo/íconos de la barra superior e imagen del hero.
- [x] T6 — Enlaces internos a `/garantia` y `/contactanos` desde `ContactSection` (home, `/precios`, servicios); párrafo extra en `/precios`. `/redes` ya estaba en el footer. San Borja y servicios ya enlazaban ambas.
- [x] T7 — LCP: `<link rel="preload" as="image" href="/iphone.webp" fetchpriority="high">` en la home (la imagen ya tenía `fetchPriority="high"` y no es lazy).
- [x] T8 — `sitemap.xml`: `lastmod` 2026-11-04 en home, `/precios`, `/sobre-nosotros`, `/contactanos` y los 5 servicios. Sin cambio: `/garantia`, `/privacidad`, `/redes`, San Borja.
- [x] T9 — `DEPLOY.md` §5: chequeo de 404 y `X-Robots-Tag`; pregunta abierta Vercel vs Dokploy.

## Metadatos nuevos
| Página | Title | Description |
| --- | --- | --- |
| `/precios` (60 car.) | Cuánto cuesta cambiar la pantalla de un celular: desde S/ 90 | Cambio de pantalla de celular desde S/ 90 (S/ 90 – S/ 110 según el modelo) y batería desde S/ 50. Precios en Lima con diagnóstico gratis y 3 meses de garantía. (159 car.) |
| `/sobre-nosotros` (58 car.) | Sobre Nosotros \| ArmalyTech, técnicos de celulares en Lima | Conoce a ArmalyTech: técnicos de celulares en San Borja, Lima. Diagnóstico gratis, repuestos de calidad y 3 meses de garantía en cada reparación. (145 car.) |

Precios usados: pantalla desde S/ 90 (rango S/ 90 – S/ 110 en OLED) y batería desde S/ 50, ambos leídos de `src/data/pricingData.js` (`getDesde`, `getRow`, `formatPrice`); no se inventó ninguno. H1 de `/precios`: "Precios de reparación de celulares en Lima".

## Alt de imágenes
Corregidos: iconos sociales del footer y del overlay del menú (`"Instagram de ArmalyTech"`, etc.), iconos de la barra superior y la imagen del hero (`"iPhone reparado por ArmalyTech"`). Se dejan con `alt=""` por ser decorativos: los tres iconos de `StepsSection` (dentro de un contenedor `aria-hidden`, junto a un título y texto) y la foto de fondo de `CtaSection` (con overlay y texto encima).

## Direcciones
Búsqueda en todo `frontend/` de variantes ("1873", "1859", "San Luis"): solo existe "Av. San Luis 1849-1851". Las coincidencias con "1859" son decimales de coordenadas en la URL del mapa embebido, no una dirección. Sin correcciones necesarias.

## Pendiente del dueño
- URL de LinkedIn para `sameAs` (no se inventó). La de Facebook (`https://www.facebook.com/profile.php?id=61590746588200`, 2026-11-05) ya está en `sameAs` de la home, el footer, el menú móvil y `/redes`.
- `aggregateRating`: no se añadió (requiere reseñas verificables; ver ADR 0017).
- Confirmar si producción es Vercel o Dokploy (`DEPLOY.md` §5).
- Decidir si `/consultar-ticket` debe prerenderizarse y entrar al sitemap (hoy es indexable pero solo cliente).

## Evidencia
Ruta de implementación: un solo writer (subagente), todo inline sobre el working tree; sin commits.

- `cd frontend && pnpm lint`: sin errores ni warnings (`--max-warnings 0`).
- `cd frontend && BACKEND_URL=http://localhost:3001 pnpm build`: OK; prerender de 13 rutas + `404.html` (`prerender 404.html 4233 B Página no encontrada | ArmalyTech`, `13 routes written, SPA shell at dist/app-shell.html`).
- `dist/`: `404.html` existe con `<meta name="robots" content="noindex, follow">` y sin canonical; `app-shell.html` existe con `#root` vacío; `index.html` sigue prerenderizado (título de la home, `hasMap`, preload del hero); `precios.html` trae el title nuevo, H1 nuevo y `BreadcrumbList`; las 5 páginas de servicio traen `BreadcrumbList`.
- `cd e2e && pnpm test`: 16 passed (usa Vite dev, así que no ejercita `vercel.ts` ni nginx).
- NO verificado: el comportamiento HTTP real de `vercel.ts` y de la plantilla nginx (no hay nginx, Docker ni Vercel CLI en esta máquina). Verificar tras el despliegue con los chequeos de `DEPLOY.md` §5.

## Criterios de aceptación
- `curl -s -o /dev/null -w "%{http_code}" <host>/pagina-que-no-existe-xyz` -> 404 con la UI de `PageError` y `noindex`.
- `/admin/login`, `/ticket/abc`, `/consultar-ticket`, `/registrar/usuario` -> 200; `/prices` -> 301 a `/precios`; `/api/*` sigue proxeado.
- `X-Robots-Tag: noindex` en `/admin/*`, `/ticket/*`, `/registrar/*`; no en `/consultar-ticket`.
- Los headers de seguridad siguen presentes en todas las respuestas, incluidas las de `404.html` y las rutas solo-cliente.
