# E2E (Playwright)

Suite de navegador para el flujo que promete el producto: **el cliente consulta el estado de su
reparación sin cuenta, y el admin puede moverla desde el panel**.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test
pnpm report            # abre el HTML report de la última corrida
```

No necesitas levantar nada: Playwright arranca sus dos `webServer`.

## Cómo se arma el entorno

| Pieza | Qué corre | Dónde |
|---|---|---|
| Backend | App Nest real contra `mongodb-memory-server` | `http://127.0.0.1:3100` — [backend/test/start-e2e-server.ts](../backend/test/start-e2e-server.ts) |
| Frontend | `vite --mode e2e` con proxy `/api` → 3100 | `http://127.0.0.1:5273` — [frontend/.env.e2e](../frontend/.env.e2e) |
| Sesión | Un login en `global-setup.ts` → cookie en `e2e/.auth/owner.json` | reutilizada por los specs |

El backend de pruebas corre con `NODE_ENV=test`, y eso hace que `AppModule` **ignore
`backend/.env`**. Consecuencia práctica: la suite nunca toca Atlas, ni Kapso, ni los webhooks de n8n,
y no puede escribir en producción ni por accidente.

## Por qué hay un `global-setup`

`POST /api/auth/login` está limitado a **5 requests/minuto por IP** (`@Throttle` en el
`AuthController`). Si cada spec hiciera su propio login, una corrida completa chocaría contra su
propio backend y fallaría con 429. El setup inicia sesión una vez y guarda la cookie; los specs la
reutilizan. Una corrida completa hace **4** requests de login: una del setup, una del test de login
por formulario, una del test de credenciales incorrectas y una del test de revocación de sesión (que
necesita su propia sesión porque la va a matar). El backend permite 5 por minuto: queda un intento de
margen. **No agregues un quinto test que inicie sesión.**

Si agregas tests, **no agregues logins**.

## Qué cubre

`tests/public-ticket-tracking.spec.ts` — el flujo crítico:

1. El cliente entra a `/consultar-ticket`, escribe el código del ticket y su celular.
2. Cae en `/ticket/<publicToken>` y ve el estado, el equipo y el costo acordado.
3. El código corto (`1`) resuelve al completo (`AT-000001`): es lo que el cliente dicta por teléfono.
4. Un celular equivocado no da acceso.
5. **La página se actualiza sola**: con la pestaña abierta, el taller mueve el ticket y el cliente ve
   el nuevo estado **sin recargar** (es la promesa que el copy le hace en pantalla).
6. El endpoint público no expone notas internas, la clave cifrada ni el teléfono.
7. Un token inventado devuelve 404. Sin sesión, `/api/tickets` devuelve 401.

`tests/session-revocation.spec.ts` — la sesión se puede cortar de verdad:

1. Se inicia sesión, se guarda la cookie y se comprueba que sirve.
2. Se cierra sesión.
3. Se **replaya la misma cookie** desde un contexto limpio → `401`. Si el logout solo borrara la
   cookie, este test seguiría pasando con `200`, así que prueba la revocación y no el borrado.
4. Cerrar sesión sin cookie es idempotente (`200 { ok: true }`) y no revela si había sesión.

`tests/security-contract.spec.ts` — los endpoints públicos no filtran ni revientan:

1. El registro de la comunidad no devuelve el documento del cliente (`phoneE164`, `consentAt`, fechas,
   `visitCount` ni el teléfono) y un anónimo **no** puede sobrescribir el nombre de un cliente existente.
2. La búsqueda pública del ticket devuelve `400` —no `500`— ante entrada malformada, y sigue exigiendo
   código y celular.

`tests/admin-ticket-workflow.spec.ts` — el otro lado:

1. El admin abre la bandeja, entra al ticket, **aprueba** la reparación y **la inicia**.
2. El cliente, en un contexto de navegador **sin sesión**, ve "Tu equipo está en reparación."
3. Sin sesión, `/admin/tickets` redirige al login; el formulario funciona; credenciales incorrectas
   se rechazan.

## Convenciones al escribir specs

- **Arrange por API, assert por UI.** El estado inicial (un ticket existente) se crea con
  `POST /api/tickets` desde `fixtures/api.ts`; lo que se mide es lo que el usuario ve en pantalla.
- **Nunca `waitForTimeout`.** Se espera por condición (una respuesta, un locator, una URL).
- Selectores por rol o por `id` estable (`#ticket-codigo`, `#login-email`), no por clases CSS.
- Un test que falla se investiga; no se relaja la expectativa. Si el flujo cambió a propósito, se
  actualiza el test y se dice por qué en el mensaje del commit.
- **No ancles aserciones al texto de estado dentro del drawer.** Un estado como "Aprobado" aparece
  dos veces —el badge y la línea de tiempo— y Playwright en modo estricto falla en vez de elegir;
  además la línea de tiempo puede repintarse después del badge, así que la aserción se vuelve una
  carrera (pasó en CI, no en local). Ancla al **botón de transición**, que existe solo en ese estado:
  "Iniciar trabajo" en `aprobado`, "Marcar como listo" en `trabajando` (ADR 0007).
- Si un selector puede coincidir con más de un elemento, sé explícito (`.first()`, un `filter`, o un
  rol con nombre exacto) en vez de confiar en el orden del DOM.
