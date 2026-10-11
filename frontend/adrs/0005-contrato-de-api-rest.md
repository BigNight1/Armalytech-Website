# ADR 0005: Contrato de API REST en JSON

## Estado

Aceptado

## Contexto

El frontend (SPA React) consume un único backend NestJS desplegado en Vercel bajo `/api/*` (ADR
0011). El PRD exige operaciones CRUD de tickets e inventario desde el panel, y consulta pública de
un ticket por enlace único. Se necesita un contrato único entre el frontend y el backend, simple y
debugeable, para un proyecto de una persona.

## Decisión

API **REST JSON** bajo `/api/*`, implementada como Controllers de NestJS, organizada por recurso y
método. Endpoints planificados:

- `/api/auth/login`, `/api/auth/logout` — sesión del panel.
- `/api/tickets` (GET, POST), `/api/tickets/{id}` (GET, PATCH, DELETE) — gestión admin.
- `/api/tickets/public/{publicToken}` (GET) — consulta pública de solo lectura, sin sesión.
- `/api/tickets/lookup-phone/{telefono}` (GET) — **PENDIENTE DE DEFINIR**: caso borde de enlace
  perdido del PRD. Falta decidir qué información se muestra (solo estado y última actualización,
  confirmación por últimos 4 dígitos, sin notas, etc.) y cómo se protege para no exponer tickets de
  otros clientes con el mismo número.
- `/api/inventory/marcas`, `/api/inventory/modelos`, `/api/inventory/repuestos` (GET, POST) y
  variantes por `{id}` (PATCH, DELETE) — inventario admin.
- `/api/migration/import` (POST admin) — carga del inventario migrado (pendiente de revisar el
  proyecto desktop, ADR 0008).

Las respuestas usan códigos de estado HTTP y cuerpos JSON uniformes (`{ ok, data | error }`), con
errores de validación como `422` (Pipes/class-validator de NestJS) y de sesión como `401`.

## Alternativas consideradas

- **GraphQL / tRPC** — contrato potente pero con curva y tooling que no aportan a un CRUD simple de
  un solo frontend y un solo backend.
- **RPC con llamadas directas internas** — válido dentro de NestJS (servicios compartidos), pero la
  cara externa al frontend sigue siendo REST JSON porque es el contrato más simple y debugeable.

## Consecuencias

- Contrato simple, testeable con curl y consumible sin librerías especiales desde el frontend.
- El backend NestJS centraliza contrato, validación (Pipes) y autorización (Guards) en un solo
  lugar, en vez de repetir validación por función.
- Trade-off: REST requiere definir manualmente la serialización y la documentación de endpoints;
  mitiga parcialmente con DTOs y decoradores de NestJS que sirven de contrato explícito.
- Trade-off: el lookup por teléfono queda como decisión abierta hasta definir qué expone y cómo
  autentica la búsqueda (ver TECH-DESIGN, riesgos).