# ADR 0022: Usuarios del panel con roles fijos

## Estado

Aceptado

## Contexto

El panel pasa de un único admin a varios usuarios (ADR 0021). Hoy basta con distinguir dos tipos:
el **admin principal**, que gestiona al personal, y los **admins**, que usan el panel y solo
administran su propia cuenta. El usuario menciona que más adelante podría querer roles creados
desde el panel, pero hoy no los necesita.

## Decisión

Se usan **roles fijos**, guardados en el campo `role` de cada usuario:

- `owner` (admin principal): todo lo de `admin`, y además la sección Personal (ADR 0023), donde
  crea, desactiva y resetea usuarios.
- `admin`: acceso a Inventario, Historial y Clientes, y a su propia sección Cuenta (ADR 0024).
- La colección `admins` se renombra a **`users`**, con los campos `username` (único, sin distinguir
  mayúsculas), `passwordHash`, `role`, `active`, `tokenVersion`, `mustChangePassword`, `createdBy`,
  `createdAt` y `updatedAt`.
- La autorización usa un decorador `@Roles('owner')` más un `RolesGuard` que lee `role` del JWT
  (ADR 0021). Las rutas sin decorador solo exigen sesión válida.
- El usuario del bootstrap (`ADMIN_USERNAME`) se crea como `owner`. Hay reglas de protección:
  siempre existe al menos un `owner` activo, un `owner` no puede desactivarse ni bajarse de rol a
  sí mismo, y no existe borrado físico de usuarios, solo desactivación (ADR 0023).

## Alternativas consideradas

- **Roles y permisos completos desde ya** (colección `roles` con permisos editables desde el
  panel) — deja lista la gestión de roles, pero exige la UI de roles y una matriz de permisos que
  hoy no se usa, con riesgo de diseñar permisos a ciegas. El usuario la descartó.
- **Roles fijos con autorización por permisos por dentro** (mapa rol → permisos en código) —
  facilitaba migrar a roles personalizados sin tocar los Guards. El usuario prefirió la opción más
  simple.

## Consecuencias

- Es simple de implementar y de entender: un campo y un Guard. Encaja con 2 a 5 usuarios.
- Trade-off: si en el futuro se agregan roles creados desde el panel, habrá que reemplazar
  `@Roles(...)` por chequeos de permisos en los endpoints protegidos y migrar el campo `role`. Ese
  trabajo se acepta a cambio de no diseñar hoy algo que no se usa.
- Trade-off: un `admin` ve todas las secciones operativas. No se puede limitar a alguien a una
  sola sección, por ejemplo solo Historial, sin un rol nuevo.
- Migración: el admin existente en la colección `admins` pasa a `users` con `role: owner`,
  `active: true` y `tokenVersion: 0`.
