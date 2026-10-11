# ADR 0024: Sección Cuenta (cada usuario edita su usuario y contraseña)

## Estado

Aceptado

## Contexto

Con varios usuarios en el panel (ADR 0022), cada persona debe poder cambiar su propio username y
su contraseña: la temporal que le dio el admin principal (ADR 0023) y cualquier cambio posterior.
Esto aplica también al `owner`. El panel se usa en PCs y celulares del local, que pueden quedar
con la sesión abierta, así que hay que evitar que otra persona le cambie las credenciales a
alguien.

## Decisión

Nueva sección **Cuenta** en el sidebar, visible para todos los roles:

- **Muestra:** username, rol y fecha de creación.
- **Cambiar username:** exige la **contraseña actual**. El nuevo username debe ser único (sin
  distinguir mayúsculas) y tener entre 3 y 32 caracteres alfanuméricos, `.`, `_` o `-`.
- **Cambiar contraseña:** exige la **contraseña actual**, la nueva y su confirmación. La nueva
  tiene **al menos 8 caracteres** y no puede ser igual a la actual.
- **Después de cualquier cambio:** se incrementa `tokenVersion` (ADR 0021) y el backend **emite un
  JWT nuevo para la sesión actual**. El usuario sigue conectado en este dispositivo y **sus otras
  sesiones se cierran**, por ejemplo en otro celular u otra PC.
- **Primer ingreso** (`mustChangePassword: true`, ADR 0023): la misma pantalla de cambio de
  contraseña se muestra de forma obligatoria. Ahí la contraseña actual es la temporal. Al cambiarla,
  `mustChangePassword` pasa a `false`.
- **Endpoints**, con sesión válida y solo sobre el propio usuario (`sub` del JWT):
  - `PATCH /api/account/username` `{ currentPassword, newUsername }`
  - `PATCH /api/account/password` `{ currentPassword, newPassword }`
- **Errores:** si la contraseña actual no coincide, responde `401` con un mensaje genérico. Si el
  username ya está tomado, responde `409`. Los intentos se limitan con el mismo throttling del
  login.

## Alternativas consideradas

- **Pedir la contraseña actual y cerrar todas las sesiones, incluida la actual** — es la más
  estricta, pero obliga a volver a iniciar sesión después de cada cambio. Se descarta por
  incómoda.
- **No pedir la contraseña actual** — es la más rápida, pero cualquiera con la PC o el celular del
  local abierto podría cambiar la contraseña y dejar afuera al dueño de la cuenta. Se descarta.

## Consecuencias

- Una sesión abierta y olvidada no alcanza para robar la cuenta: cualquier cambio exige la
  contraseña actual.
- Si alguien sospecha que otra persona usa su cuenta, cambiar la contraseña corta al instante
  las demás sesiones y deja viva solo la propia.
- Trade-off: el formulario tiene un campo más (contraseña actual). Además, si alguien olvida su
  contraseña no puede recuperarla solo: el `owner` tiene que resetearla desde Personal (ADR
  0023). No hay recuperación por correo.
- Trade-off: si el `owner` olvida su propia contraseña y no hay otro `owner`, la única salida es
  administrativa (script o edición en la base). Hoy no existe recuperación automática.
