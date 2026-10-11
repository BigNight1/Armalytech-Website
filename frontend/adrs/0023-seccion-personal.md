# ADR 0023: Sección Personal (gestión de usuarios del panel)

## Estado

Aceptado

## Contexto

Con varios usuarios en el panel (ADR 0021, ADR 0022), el admin principal (`owner`) necesita dar de
alta al personal y quitarle el acceso cuando corresponda. El usuario pidió que el principal cree
el usuario y la contraseña, y que después cada persona pueda cambiar los suyos (ADR 0024). Falta
definir qué pasa con la contraseña inicial y cómo se saca a alguien sin perder trazabilidad.

## Decisión

Nueva sección **Personal** en el sidebar, visible solo para `owner`:

- **Lista:** usuario, rol, estado (activo o inactivo), creado por y fecha. Al hacer clic se abre el
  detalle del usuario.
- **Crear usuario:** el `owner` define el username y una **contraseña temporal**. El usuario se crea
  con `role: admin` y `mustChangePassword: true`.
- **Primer ingreso:** mientras `mustChangePassword` sea `true`, el backend solo permite `GET
  /auth/me`, `POST /auth/logout` y el cambio de contraseña. El frontend redirige a una pantalla de
  "Crea tu nueva contraseña" antes de mostrar el panel.
- **Desactivar o reactivar:** es un borrado lógico (`active: false`). Incrementa `tokenVersion`, así
  que las sesiones abiertas se cortan al instante (ADR 0021). Un usuario inactivo no puede iniciar
  sesión.
- **Resetear contraseña:** el `owner` define una nueva contraseña temporal. Vuelve a poner
  `mustChangePassword: true` e incrementa `tokenVersion`.
- **Reglas:** el `owner` no puede desactivarse a sí mismo y siempre debe quedar al menos un `owner`
  activo (ADR 0022). No existe el borrado físico.
- **Endpoints**, todos con `@Roles('owner')`: `GET /api/staff`, `GET /api/staff/:id`, `POST
  /api/staff`, `PATCH /api/staff/:id` (activar o desactivar) y `POST
  /api/staff/:id/reset-password`.

## Alternativas consideradas

- **Contraseña definitiva sin cambio obligatorio** — es la más directa. Se descarta porque el
  principal conocería la contraseña del otro usuario hasta que este decidiera cambiarla, y muchos
  no la cambian.
- **Contraseña temporal con borrado físico** — la lista queda más limpia, pero se pierde el rastro
  de quién creó o editó registros y no hay vuelta atrás. Se descarta.

## Consecuencias

- El `owner` nunca conoce la contraseña final de los demás, y queda registro de quién creó a cada
  usuario.
- Desactivar a alguien corta su acceso al instante, incluso con sesiones abiertas en otros
  dispositivos.
- Trade-off: el primer ingreso de cada usuario suma un paso obligatorio, y la contraseña temporal
  hay que comunicarla por fuera del sistema, en persona o por WhatsApp.
- Trade-off: los usuarios inactivos quedan en la base para siempre. Se acepta porque son pocos.
