# ADR 0015: Consentimiento explícito de marketing (política Meta)

## Estado

Aceptado

## Contexto

Meta endureció en 2025 los requisitos de opt-in para la API de WhatsApp Business: dejar el número
o iniciar una conversación ya no alcanza como consentimiento para recibir campañas de marketing.
El formulario de registro es el momento natural —y el único— para capturar ese consentimiento.

## Decisión

El formulario de la ruta de registro (ADR 0012) incluye un **checkbox obligatorio** con un texto
claro tipo *"Acepto recibir ofertas y promociones por WhatsApp"*. Si el cliente no lo marca, no se
puede registrar. El backend guarda el consentimiento con su fecha en el documento del cliente:

```
consentimiento: { aceptado: true, fecha: <timestamp de registro> }
```

- Solo los clientes con `consentimiento.aceptado === true` entran en listas de campañas.
- La fecha de consentimiento queda registrada para auditoría ante Meta.
- El `POST /api/comunidad/registro` rechaza (400) un registro sin consentimiento.

## Alternativas consideradas

- **Consentimiento tácito por dejar el número en el formulario** — riesgoso ante la política Meta
  2025+ (podría suspender el número de negocio ante quejas); se descarta.
- **Consentimiento doble (checkbox + mensaje de confirmación por WhatsApp)** — máxima seguridad,
  pero agrega fricción y complejidad de flujo; se difiere como refuerzo futuro si Meta lo exige.

## Consecuencias

- Una fricción más en el formulario, que puede bajar levemente la tasa de conversión del registro.
- Blindaje del número de negocio ante la política de Meta: envíos solo a números consentidos y con
  evidencia de cuándo.
- Trade-off: el consentimiento capturado una sola vez; si el cliente quiere revocarlo, hace falta
  un mecanismo (mensaje "BAJA" o gestión manual en el panel) — pendiente de diseño.

## Actualización (2026-09-25)

El checkbox obligatorio bajaba la conversión del registro (ADR 0012) más de lo aceptable: un
cliente que solo quería su tarjeta de sellos (loyalty, ADR 0013) y no quería marketing no podía
registrarse. Se decide **volver el consentimiento opcional**:

- `POST /api/community/register` (`RegisterClientUseCase`) ya **no rechaza** un registro con
  `marketingConsent: false`. El cliente se registra (o se reconoce, si el número ya existe) con el
  consentimiento que envió. Se elimina la vía `registro_rechazado` / `rejectReason:
  'sin_consentimiento'`; la única causa de rechazo que queda en este endpoint es
  `numero_invalido`.
- El copy del checkbox pasa de "Acepto recibir ofertas y promociones por WhatsApp." +
  "Opcional. Puedes darte de baja cuando quieras respondiendo BAJA." a mantener la primera línea y
  reemplazar la segunda por "Opcional. Puedes pedir que dejemos de escribirte cuando quieras." (el
  mecanismo de baja en sí — probablemente un flujo de IA sobre WhatsApp — queda para más adelante,
  fuera de esta actualización).
- **Nunca se degrada** un consentimiento ya aprobado: en un registro repetido (mismo número),
  `ClientRepository.upsertVisit` solo puede subir `declined → approved` (y en ese caso refresca
  `consentAt` con la fecha de esa nueva aceptación); si ya estaba aprobado, se conserva tal cual
  aunque el envío repetido llegue con `marketingConsent: false`.
- El envío de mensajería de marketing sigue exclusivamente condicionado al consentimiento vigente
  del cliente (`SendCommunityMessageUseCase` y el aviso de umbral de sellos en
  `RegisterVisitUseCase` verifican `client.marketingConsent` antes de notificar) — este cambio no
  toca esa validación, solo cómo se captura y actualiza el consentimiento en el registro.
- La regla de loyalty (ADR 0013) no cambia: un registro repetido nunca suma visita/sello, solo
  reconoce al cliente (`isNewClient: false`).