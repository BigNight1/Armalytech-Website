# ADR 0020: Arquitectura limpia por feature (backend y frontend)

## Estado

Aceptado

## Contexto

El backend NestJS (ADR 0011) y el panel admin del frontend (ADR 0001, 0009) crecen por
features (auth, inventory, cash-closings; luego tickets, comunidad). El usuario pidió
explícitamente (2026-09-23) una estructura "screaming architecture" por feature con Clean
Architecture en el backend, y container/presentational + capa de servicio de API en el frontend,
en vez de organizar por tipo técnico (controllers/, models/, services/ globales).

## Decisión

**Backend** (`backend/src/<feature>/`):

- `domain/`: entidades, value objects y puertos de repositorio (interfaces) más errores de
  dominio. Cero imports de `@nestjs`, `mongoose` o `express`.
- `application/`: una clase de caso de uso por operación de negocio, dependiendo solo de puertos
  del dominio (inyectados por token DI). Los errores son de dominio, nunca `HttpException`.
- `infrastructure/`: esquemas de Mongoose, adaptadores de repositorio que implementan los
  puertos, controllers/DTOs de Nest (el adaptador HTTP) y el módulo de Nest que conecta tokens →
  adaptadores. Un filtro global mapea errores de dominio a códigos HTTP.
- Regla de dependencia: `infrastructure → application → domain`, nunca al revés.

**Frontend** (`frontend/src/admin/<feature>/`):

- `api/`: un módulo de servicio por feature, construido sobre `shared/api/httpClient`. Los
  componentes y hooks nunca llaman `fetch`/`httpClient` directamente.
- `hooks/`: hooks locales de la feature (fetching, estado derivado).
- `components/`: componentes presentacionales — reciben props, devuelven JSX, sin fetch.
- `<Feature>Page.jsx` (contenedor): conecta hooks + `api/` + componentes presentacionales.

Ver `backend/README.md` y `frontend/src/admin/README.md` para el detalle ya implementado
(auth, inventory, cash-closings; shared foundation del panel).

## Alternativas consideradas

- **Organización por tipo técnico** (`controllers/`, `services/`, `models/` a nivel de app) —
  rechazado: dificulta ver qué archivos pertenecen a qué feature y mezcla capas al crecer.
- **Sin capa `domain` explícita en el backend** (lógica directo en el controller o el
  servicio de Nest) — rechazado: acopla las reglas de negocio a Mongoose/Nest, dificultando
  testear casos de uso sin levantar el framework (los tests unitarios actuales corren los
  use cases contra repositorios fake, ver `backend/README.md`).
- **Componentes con fetch inline en el frontend** — rechazado: el patrón previo (`api/contact.js`)
  ya mostró que mezclar la llamada HTTP con la UI complica reusar y testear; se prefiere el
  service layer explícito por feature.

## Consecuencias

- Cada feature es autocontenida y se puede leer/testear de forma aislada; agregar una feature
  nueva (tickets, comunidad) sigue el mismo layout sin sorpresas.
- Trade-off: más archivos/carpetas por feature pequeña que un CRUD simple no siempre necesita;
  aceptado por consistencia y porque el dominio (stock, cierre de caja) sí tiene reglas de negocio
  no triviales (ADR 0006 actualizado).
- Trade-off: exige disciplina para no filtrar imports de framework hacia `domain/`; el filtro de
  errores global y las revisiones de código son la mitigación.
