---
title: "ArmalyTech — Panel de Tickets e Inventario Web"
---

# PRD: ArmalyTech — Panel de Tickets e Inventario Web

## Problema

Hoy el seguimiento de una reparación depende 100% de comunicación manual (WhatsApp o
llamada telefónica): el cliente no tiene ninguna forma de saber en qué estado está su
equipo sin contactar directamente al técnico, y el técnico pierde tiempo respondiendo
la misma pregunta ("¿ya está mi equipo?") repetidamente.

En paralelo, el negocio ya resolvió la gestión de inventario (marcas, modelos,
repuestos) con una aplicación de escritorio (Invetario-Armalytech), pero esos datos
viven aislados en una base de datos SQLite local, sin poder conectarse al sitio web
ni ser accedidos desde otro lugar que no sea esa PC.

<!-- REVISAR: framing mixto validado por el usuario — combina "dolor concreto" (falta
de visibilidad del estado para el cliente) con "escalar lo que ya existe" (inventario
aislado en app local). -->

## Usuario objetivo

Un solo rol técnico/admin (el dueño del negocio o quien haga sus veces) que:

- Crea y gestiona tickets de reparación (celular, laptop, tablet u otros equipos).
- Actualiza el inventario (marcas → modelos → repuestos) desde el panel web.
- Comparte con el cliente un enlace único por ticket para que este vea el estado de
  su equipo.

El cliente es un usuario secundario de **solo lectura**: recibe el enlace del ticket
(por WhatsApp, por ejemplo) y lo usa para consultar el estado de su equipo, sin
necesidad de cuenta ni contraseña. No confirma recojo ni negocia presupuesto dentro
del sistema — eso se sigue conversando al momento de crear el ticket, fuera del panel.

<!-- REVISAR: por ahora es un solo técnico/admin — si el negocio crece a más de una
persona operando tickets, esta sección deberá revisarse (permisos diferenciados). -->

## Objetivo / resultado esperado

Resultado híbrido, con el mismo peso entre ambos:

- **Operativo**: reducir el tiempo que el técnico gasta respondiendo consultas de
  seguimiento por WhatsApp/llamada, porque el cliente puede autoconsultarse por el
  enlace.
- **De negocio**: que el sitio deje de ser solo una vitrina estática y se convierta en
  una herramienta que transmite más profesionalismo y confianza, ayudando a atraer y
  retener más clientes (incluyendo futuras iniciativas de crecimiento como sorteos
  para atraer tráfico — ver Alcance).

## Alcance (qué sí incluye esta versión)

- Panel administrativo (protegido, un solo rol admin/técnico) accesible desde
  cualquier lugar, no solo desde una PC local.
- Creación de tickets de reparación con, al menos:
  - Tipo de equipo (celular, laptop, tablet u otro).
  - Datos de contacto del cliente (nombre, apellido, número de teléfono).
  - Estado del ticket (pendiente, trabajando, listo — ver Casos borde para estados
    adicionales a evaluar en diseño).
  - Comentarios/notas sobre el progreso o complicaciones (ej. cambios de horario,
    piezas pendientes).
- Enlace público único por ticket, generado al crear el ticket, para que el cliente
  consulte el estado sin necesidad de cuenta.
- Migración del inventario (marcas → modelos → repuestos) desde la app local
  (Invetario-Armalytech / SQLite) hacia una base de datos web accesible desde el
  panel administrativo, conservando la estructura jerárquica ya existente.
- Gestión de inventario (crear/editar/eliminar marcas, modelos y repuestos) desde el
  mismo panel administrativo, usable desde cualquier lugar.

<!-- REVISAR: la estructura exacta de campos del ticket (qué estados además de
pendiente/trabajando/listo, qué campos del cliente son obligatorios) queda para la
etapa de diseño detallado del ticket, a definir con el usuario. -->

## No alcance (qué explícitamente no incluye esta versión)

- No incluye pagos en línea — el cobro se sigue haciendo en persona (efectivo/Yape),
  como hoy.
- No incluye notificaciones automáticas por WhatsApp/SMS cuando cambia el estado del
  ticket — el cliente debe entrar al enlace cuando quiera revisar.
  - **Actualización 2026-10-25 (decisión del usuario):** el envío por WhatsApp sí entra en
    alcance, pero acotado al hito acordado, no a cada transición. Se hace por plantillas
    desde el detalle del ticket como envío manual (ADR 0027) y, con
    `WHATSAPP_AUTO_TICKET_LISTO` activo, como aviso automático al pasar a `listo`
    (ADR 0026 / ADR 0029). Sigue fuera de alcance avisar `pendiente`, `aprobado`,
    `trabajando`, `entregado` o `cancelado`, y sigue fuera de alcance que el cliente
    responda dentro del sistema.
- No incluye login o cuenta de usuario para el cliente — el enlace público es
  suficiente, sin contraseña.
- No incluye gestión multi-sucursal.
- **Actualización 2026-09-23 (decisión del usuario):** el panel admite varios usuarios con
  dos roles fijos, `owner` (admin principal) y `admin`, más las secciones Personal y Cuenta
  (ADR 0021 a 0024). Siguen fuera de alcance los roles con permisos personalizados.
- No incluye el sorteo ni otras funciones de marketing para atraer tráfico — quedan
  para una fase posterior, fuera de esta versión.

## Criterios de éxito

<!-- REVISAR: números y ventana de tiempo son propuesta del agente; falta validar
umbrales concretos con el usuario. -->

- Reducción notable de mensajes/llamadas de seguimiento ("¿ya está mi equipo?") en
  las primeras 4 semanas posteriores al lanzamiento, comparado con el mes previo.
- Aumento en la cantidad de tickets/clientes atendidos por mes, comparando el
  trimestre posterior al lanzamiento contra el trimestre previo.

## Casos borde a contemplar

- El cliente pierde el enlace del ticket y necesita recuperarlo (ej. buscándolo por
  su número de teléfono).
- Un mismo cliente tiene varios equipos en reparación al mismo tiempo (varios tickets
  activos).
- El técnico se equivoca al cambiar el estado de un ticket y necesita poder
  revertirlo.
- Un repuesto usado en un ticket deja el inventario en cantidad 0 — el sistema debe
  avisar, no bloquear silenciosamente la operación.
- El enlace del ticket es público: debe generarse con un identificador no adivinable
  (no un número secuencial tipo `/ticket/1`, `/ticket/2`) para que un cliente no
  pueda acceder al ticket de otro cliente cambiando la URL.

## Supuestos y riesgos abiertos

<!-- REVISAR: supuestos técnicos inferidos por el agente a partir del repositorio
existente; falta validar con el usuario. -->

**Supuestos:**

- El negocio sigue operando con un solo técnico/local en el corto plazo (no
  multi-sucursal).
- Se puede aprovechar la infraestructura ya existente del sitio (repo en GitHub,
  despliegue tipo Vercel con funciones serverless, visto en `api/contact.js`) para
  alojar el backend y la base de datos nuevos.

**Riesgos:**

- Migrar el inventario de SQLite local (Invetario-Armalytech) a una base de datos en
  la nube implica elegir proveedor (ej. Postgres gestionado) y migrar los datos
  existentes sin perderlos.
- Si no se define bien la autenticación del panel administrativo, cualquiera que
  encuentre la URL podría editar tickets o inventario sin autorización.
- El sitio actual no tiene backend de datos propio (solo una función de contacto sin
  estado); construir tickets + inventario implica introducir infraestructura nueva
  (base de datos, autenticación) que no existía antes en este proyecto.
