# ADR 0003: Base de datos MongoDB gestionada

## Estado

Aceptado

## Contexto

El PRD requiere persistencia nueva (tickets, inventario web) y la migración del inventario existente
desde la SQLite local de Invetario-Armalytech. El usuario inicialmente planteó Postgres en Neon,
pero tras revisar las opciones decidió explícitamente usar **MongoDB**, con la que está más
familiarizado. El proyecto se despliega en Vercel free tier, por lo que la base debe ser un servicio
gestionado sin servidor propio ni costo fijo.

## Decisión

Usar **MongoDB Atlas (cluster free tier M0)** como base de datos gestionada, accedida desde el
backend NestJS con **Mongoose** (`@nestjs/mongoose`), reutilizando una conexión cacheada en el
runtime de la función serverless. El inventario del proyecto de escritorio Invetario-Armalytech se
guarda en MongoDB y se recibe desde el panel web. **En esta versión no se incluye estrategia de
backup/restore** (decisión del usuario: proyecto pequeño); el riesgo queda aceptado y registrado en
el TECH-DESIGN.

## Alternativas consideradas

- **PostgreSQL en Neon** — opción inicial del usuario; relacional y madura, pero descartada porque
  el usuario prefiere MongoDB y ya la maneja con experiencia.
- **Driver nativo `mongodb` sin ODM** — viable y liviano, pero con NestJS el ecosistema estándar es
  Mongoose (esquemas, validación, decoradores); se elige Mongoose porque reduce validación manual y
  crece con el modelo.
- **Backup automatizado / PITR** — excluido en esta versión por decisión explícita del usuario
  (proyecto pequeño); repasar cuando haya datos de clientes que no se puedan perder.

## Consecuencias

- El usuario opera con una tecnología conocida; consultas y mantenimiento más rápidos para él.
- El free tier M0 da ~512 MB de almacenamiento y sin costo mensual, coherente con Vercel free tier.
- Trade-off: MongoDB es NoSQL: la integridad relacional (marcas → modelos → repuestos) debe
  garantizarse a nivel de aplicación y de índices, no con foreign keys.
- Trade-off: Mongoose agrega peso al bundle y algo de cold start; mitigado por conexión cacheada.
- Trade-off: sin backups, una migración mal ejecutada o un borrado accidental puede perder datos; el
  escape actual es re-importar desde la SQLite original o el reingreso manual.