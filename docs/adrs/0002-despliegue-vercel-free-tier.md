# ADR 0002: Despliegue en Vercel con funciones serverless

## Estado

Aceptado (heredado) — con restricción explícita del usuario

## Contexto

El proyecto ya está desplegado en Vercel: existe `vercel.json` (rewrites del router a `/` para la
SPA) y una función serverless existente `api/contact.js`. El usuario confirma el despliegue del
nuevo módulo en **Vercel free tier**.

## Decisión

Desplegar el proyecto en **Vercel free tier**: el frontend (SPA React) como estático con sus
rewrites existentes, y el **backend NestJS** como función serverless bajo `/api/*` en el mismo
proyecto (ver ADR 0011). El repo queda estructurado en `frontend/` y `backend/`.

## Consecuencias

- Un solo proyecto y un solo pipeline: la SPA y el backend NestJS comparten deploy, dominio y
  variables de entorno, sin infraestructura extra que administrar.
- NestJS corre como una sola función serverless de Vercel: arranca por request (cold starts más
  pesados que funciones individuales), lo que condiciona el patrón de conexión a MongoDB (ADR 0003).
- Trade-off: en free tier las funciones tienen límites de duración, memoria y bandwidth; no apto
  para cargas altas, pero suficiente para un negocio de un solo técnico/local.
- Trade-off: el tamaño del bundle del backend crece (framework NestJS), lo que alarga los cold
  starts; mitigado sin carga real en esta escala.