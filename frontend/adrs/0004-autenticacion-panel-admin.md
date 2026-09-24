# ADR 0004: Autenticación del panel administrativo

## Estado

Aceptado

## Contexto

El PRD define un único rol admin/técnico y marca como riesgo explícito que "cualquiera que encuentre
la URL podría editar tickets o inventario sin autorización". El alcance excluye múltiples técnicos y
cuentas de cliente. Se requiere una autenticación que proteja el panel sin agregar dependencias
externas ni costos.

## Decisión

Autenticación de **usuario + password con hash guardada en MongoDB y cookie de sesión firmada**:

- Al crear el admin (bootstrap), el password se hashea (bcrypt/argon2) y se guarda en la colección
  `admin` de MongoDB (usuario + hash), no en variables de entorno.
- Al validar, el backend NestJS compara el hash y emite una cookie `httpOnly`, `secure`,
  `SameSite=Lax`, firmada con HMAC (`SESSION_SECRET`), con expiración.
- La **autorización** de cada ruta del panel se aplica como una capa de seguridad del framework:
  Guards de NestJS verifican la sesión antes de que el handler ejecute; si el usuario no está
  autorizado, responde `401`. Login en `/api/auth/login`, logout en `/api/auth/logout`.

## Alternativas consideradas

- **Basic Auth (HTTP)** — lo más simple, pero el navegador muestra su prompt nativo feo, no hay
  logout limpio ni expiración controlable.
- **Auth externo (Clerk u otro proveedor)** — integración rápida, pero agrega una dependencia
  externa con límites propios de free tier y transferencia de datos a un tercero, innecesaria para
  un solo admin.
- **Credenciales solo en variables de entorno de Vercel** — simple, pero no persistente y con
  reseteo incómodo; el usuario pidió explícitamente guardar el hash.

## Consecuencias

- El hash vive en la base: se puede actualizar el password desde una herramienta admin/CLI sin
  redeploy y el hash es la única credencial persistida.
- La seguridad queda de nuestra cuenta: hash con bcrypt/argon2, cookie firmada con un secreto fuerte,
  `httpOnly` + `secure` + `SameSite=Lax`, Guards en cada ruta.
- Trade-off: sin 2FA, sin reset gestionado por UI y sin revocación central de sesiones; al rotar el
  password la cookie existente sigue válida hasta expirar o rotar `SESSION_SECRET`. Riesgo aceptado
  para un solo admin.