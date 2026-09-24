# ADR 0011: Backend con NestJS

## Estado

Aceptado

## Contexto

El usuario decidió que el inventario de Invetario-Armalytech pase a la web con frontend y backend
propios, y definió explícitamente que **el backend se construya con NestJS**. El proyecto ya está
desplegado en Vercel free tier (ADR 0002) con un frontend React + Vite existente en `frontend/`; la
persistencia es MongoDB Atlas (ADR 0003). Se necesita un backend estructurado que sirva el contrato
REST del ADR 0005 con autenticación (ADR 0004), y que pueda crecer en módulos (tickets, inventario,
migración).

## Decisión

Construir el backend en **NestJS** (Node.js + TypeScript) en el directorio `backend/`, como una sola
aplicación modular desplegada como función serverless de Vercel bajo `/api/*`:

- Módulos: `AuthModule` (login/logout, Guards), `TicketsModule`, `InventoryModule` (marcas →
  modelos → repuestos), `MigrationModule` (import desde SQLite).
- `AppModule` raíz exporta el adaptador serverless de NestJS (`@nestjs/platform-serverless`) para
  correr en Vercel.
- Validación con Pipes + `class-validator`; autorización con Guards (ADR 0004, ADR 0010).
- Acceso a MongoDB con `@nestjs/mongoose` (ADR 0003).

## Alternativas consideradas

- **Funciones serverless individuales por recurso (patrón `api/contact.js`)** — el patrón previo del
  repo; simple pero sin framework: repetir validación, autorización y estructura en cada función, y
  sin DI ni módulos. Rechazado porque el usuario pidió NestJS y el dominio tiene varios módulos.
- **Express/Fastify a mano** — viable y liviano, pero sin la estructura, decoradores, Guards y Pipes
  que NestJS aporta y que el usuario conoce o quiere adoptar.
- **Backend separado en otro host (Railway/Render)** — desplegar NestJS como proceso vivo; rechazado
  para mantener la restricción de Vercel free tier y un solo pipeline.

## Consecuencias

- Estructura profesional con módulos, DI, Guards y Pipes; el código del panel queda organizado y
  testeable.
- Trade-off: NestJS como función serverless de Vercel agrega peso (bundle grande y cold starts más
  lentos) comparado con funciones individuales; aceptable a esta escala.
- Trade-off: requiere conocer TypeScript/NestJS (patrones de NestJS: decoradores, módulos, inyección
  de dependencias) — sube la curva del proyecto frente al patrón anterior de funciones sueltas.
- Trade-off: la migración de la SPA existente hacia consumir este backend es un cambio estructural
  en `frontend/`; el endpoint legacy `api/contact.js` sigue conviviendo hasta migrar.