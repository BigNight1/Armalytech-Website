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