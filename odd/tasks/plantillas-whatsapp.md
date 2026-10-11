# Plantillas de WhatsApp para aprobación de Meta

## Objetivo
Crear en Meta (Administrador de WhatsApp → Plantillas de mensajes) las 5 plantillas que definen los ADR 0026 y 0027, y dejar registrado su estado de aprobación.

## Reglas que aplican a todas
- **Idioma:** Español (`es`).
- **Variables:** `{{1}}`, `{{2}}`…, siempre con valor de ejemplo. El texto **no empieza ni termina** con una variable (Meta lo rechaza).
- **Utilidad (`ticket_listo`):** sin nada promocional; si no, Meta la reclasifica como Marketing.
- **Marketing:** llevan el botón de respuesta rápida **"Dejar de recibir promociones"**. El bot lo procesa como `BAJA` (ADR 0026) y solo se envían a clientes con consentimiento (ADR 0015).
- **Enlace "Cómo llegar":** `https://maps.app.goo.gl/kQnPY8uYo8E1EsZJ8` (el mismo que usa la página `Redes`).
- **Enlace de reseña:** `https://www.armalytech.com/resena`, una ruta del sitio que redirige a Google; así se puede cambiar el destino sin volver a aprobar la plantilla.

## 1. `ticket_listo` — Utilidad
- **Encabezado (texto):** `Tu equipo está listo`
- **Cuerpo:**
  > Hola {{1}}, tu {{2}} ya está listo para recoger. Tu número de ticket es {{3}}. Puedes ver el detalle de la reparación y el saldo pendiente con el botón de abajo. Te esperamos en tienda.
- No usar la palabra "código": Meta la interpreta como un código de verificación y sugiere la categoría Autenticación.
- **Ejemplos:** `{{1}}` = Juan · `{{2}}` = Samsung Galaxy A52 · `{{3}}` = AT-000123
- **Pie:** `ArmalyTech · Servicio técnico`
- **Botones:**
  - Respuesta rápida: `Gracias, voy a recogerlo` (abre la ventana de 24 h, ADR 0026).
  - URL dinámica: `Ver detalle` → `https://www.armalytech.com/ticket/{{1}}` (ejemplo: `15a41860-4efd-4877-9e4a-000000000000`).
  - URL estática: `Cómo llegar` → enlace de Maps.

## 2. `resena_google` — Marketing
- **Cuerpo:**
  > ¡Gracias por confiar en ArmalyTech, {{1}}! 💙 Nos ayudaría muchísimo que nos dejes tu comentario para seguir creciendo y ayudar a otras personas con sus celulares ⭐
- **Ejemplo:** `{{1}}` = Juan
- **Botones:**
  - URL estática: `Dejar mi reseña` → `https://www.armalytech.com/resena`
  - Respuesta rápida: `Dejar de recibir promociones`

## 3. `promo_descuento` — Marketing
- **Cuerpo:**
  > ¡Hola {{1}}! 🎉 Completaste tus visitas en ArmalyTech Club y ganaste {{2}} de descuento en tu próximo servicio. Muestra este mensaje en tienda para usarlo. ¡Te esperamos!
- **Ejemplos:** `{{1}}` = Juan · `{{2}}` = 20 %
- **Botones:**
  - URL estática: `Cómo llegar` → enlace de Maps
  - Respuesta rápida: `Dejar de recibir promociones`

## 4. `invitar_volver` — Marketing
- **Cuerpo:**
  > ¡Hola {{1}}! Hace tiempo que no te vemos por ArmalyTech. ¿Tu celular necesita cambio de batería, limpieza o una revisión? Escríbenos y te atendemos con prioridad.
- **Ejemplo:** `{{1}}` = Juan
- **Botones:**
  - Respuesta rápida: `Quiero una revisión` (abre la ventana de 24 h)
  - Respuesta rápida: `Dejar de recibir promociones`

## 5. `bienvenida_comunidad` — Marketing
- **Cuerpo:**
  > ¡Bienvenido a ArmalyTech Club, {{1}}! 🎉 Ya tienes tu tarjeta de fidelización: con cada visita sumas un sello y en la quinta obtienes 20 % de descuento. Guarda este número para enterarte de nuestras promociones.
- **Ejemplo:** `{{1}}` = Juan
- **Botones:**
  - URL estática: `Cómo llegar` → enlace de Maps
  - Respuesta rápida: `Dejar de recibir promociones`

## Revisión de cuentas (2026-10-05, solo lectura)
- **Negocio verificado en Meta** ("ARMAS ALIAGA EDUARDO MARTIN", verificado el 28/09/2026). El bloqueo `2494160` del ADR 0026 ya no aplica.
- **Cuenta de WhatsApp real:** "Armaly Tech" (ID `746711785108230`), con 0 plantillas. Hay otra cuenta, "Test WhatsApp Business Account" (ID `941728948545295`), con plantillas de ejemplo de Meta: **no usar esa**.
- **Número:** +51 924 548 268 ("Armaly Tech"), en estado **"Sin conexión"**. Está registrado, pero no conectado a la Cloud API, así que hoy no se pueden enviar mensajes por API. La aprobación de plantillas no depende de esto.
- **Dokploy:**
  - proyecto "Servidor": servicios "Servidor Armalytech" (backend), "Frontend Armalytech test" y "SERVIDOR DE VERSABIZ";
  - proyecto "Automatizaciones": n8n + Postgres + Ollama.
  - No se abrieron las variables de entorno (tienen secretos).

## Estado en Meta
| Plantilla | Categoría | Estado | Fecha | Notas |
|---|---|---|---|---|
| `ticket_listo` | Utilidad | Sin crear (envío rechazado) | 2026-10-05 | Meta: "Esta cuenta de WhatsApp Business no tiene permiso para administrar plantillas". La cuenta "Armaly Tech" es de tipo "App de WhatsApp Business" y el número está "Sin conexión" con la API. Además, con el texto "Tu código de ticket es {{3}}" Meta sugería la categoría Autenticación; se cambió a "Tu número de ticket es {{3}}". |
| `resena_google` | Marketing | Sin crear | — | — |
| `promo_descuento` | Marketing | Sin crear | — | — |
| `invitar_volver` | Marketing | Sin crear | — | — |
| `bienvenida_comunidad` | Marketing | Sin crear | — | — |

## Bloqueo actual: el número no está conectado a la API (2026-10-05)
App de Meta **"Armalytech"** (ID `28526639573615071`) → Casos de uso → Conectar en WhatsApp → **Paso 2: Configuración de producción**:
- [ ] **Webhooks:** sin configurar (URL de devolución de llamada + token de verificación). Apunta al WhatsApp Trigger de n8n.
- [x] **Registrar número:** con check, pero el número figura "Sin conexión" en el Administrador de WhatsApp.
- [ ] **Información de pago para mensajes iniciados por la empresa:** pendiente (la cuenta ya tiene una VISA cargada).
- [ ] **Enviar mensaje de prueba:** pendiente.
- [ ] **Publicar la app:** está sin publicar. Mientras siga así, Meta no entrega webhooks de producción.
  - [x] Política de privacidad creada en `https://www.armalytech.com/privacidad` (2026-10-06), con la sección de eliminación de datos en `#eliminacion-de-datos`. **Pendiente de desplegar.** URLs para Meta: privacidad → `/privacidad`; eliminación de datos → `/privacidad#eliminacion-de-datos`; términos → `/contactanos`.
- [x] Credenciales de n8n verificadas (2026-10-06): "WhatsApp OAuth account" (App ID 28526639573615071 + App Secret) y "WhatsApp account" (token + WABA 746711785108230). Las dos con "Connection tested successfully".
- **Decisión del usuario:** coexistencia (app del celular + API). Según la documentación de Meta, solo la pueden hacer los Tech Providers o Solution Partners mediante Embedded Signup.
- **Decisión pendiente del usuario:** conectar el número en **coexistencia** (se sigue usando la app WhatsApp Business del celular) o **migrarlo por completo** a la API (el número deja de funcionar en la app del celular).

## Pendiente en el código (no está implementado)
Hoy el backend envía **texto libre** a n8n (`promo_20`, `google_review`, `reconnect` en `backend/src/community/infrastructure/webhook-community-notifier.ts`). Para usar estas plantillas falta, según los ADR 0026 y 0027:
- Enviar a n8n el **nombre de la plantilla + parámetros** en lugar de texto.
- Evento de cambio de estado del ticket (`listo` → `ticket_listo`; `entregado` → reseña) hacia n8n, con token compartido.
- `lastInboundAt` por número en el backend (ventana de 24 h) y la lógica "gratis / plantilla / wa.me" en los botones del panel.
- Endpoint de bajas y estados de entrega; ruta `/resena` en el sitio.
- Nodos de n8n que envíen plantillas por la Cloud API.
