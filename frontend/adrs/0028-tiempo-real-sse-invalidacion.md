# ADR 0028: Tiempo real en el panel con SSE e invalidación de React Query

## Estado

Aceptado (2026-09-27)

## Contexto

Dos administradores usan el panel a la vez, y los clientes se registran solos desde
`/registrar/usuario`. El panel solo se actualizaba al recargar o al volver a la pestaña
(`refetchOnWindowFocus`, `staleTime: 30s`), así que un admin no veía los cambios del otro ni los
registros nuevos.

Restricciones:

- El backend en producción corre en **Dokploy**, en un solo contenedor siempre encendido. Vercel
  serverless queda como legado.
- Toda escritura pasa por la API de NestJS. n8n solo recibe eventos del backend y nunca escribe
  en él (ADR 0016).
- La sesión es un JWT en cookie httpOnly, en el mismo dominio (ADR 0021).

## Decisión

1. **El servidor solo avisa qué cambió:** envía `{ topic }` por **Server-Sent Events** en
   `GET /api/events`, con sesión obligatoria.
2. **React Query sigue siendo la fuente de verdad:** al recibir el aviso, el panel ejecuta
   `invalidateQueries` sobre la clave raíz de esa sección y vuelve a pedir los datos a la API de
   siempre. El evento nunca lleva datos de negocio ni datos personales.
3. **Topics:** `clients`, `tickets`, `sales`, `inventory`, `staff`. Una operación puede publicar
   varios; por ejemplo, una venta publica `sales` + `inventory`.
4. **Bus interno en memoria:** un `Subject` de rxjs detrás del puerto `RealtimePublisher`. Cada caso
   de uso publica **después** de guardar con éxito.
5. **Latido:** `ping` cada 25 s. Al reconectarse, el panel invalida todo una vez.
6. **Proxy:** nginx tiene un bloque propio para `/api/events`, con `proxy_buffering off` y
   `proxy_read_timeout 1h`. En Traefik, sin compresión y con HTTP/2.
7. **Sin polling.** Se mantiene `refetchOnWindowFocus`.

## Alternativas consideradas

- **Polling cada N segundos:** peticiones inútiles cuando no cambia nada. Se descarta.
- **WebSocket / Socket.IO:** es comunicación en los dos sentidos y aquí no se necesita. Suma
  dependencias y otra autenticación. Se descarta.
- **MongoDB Change Streams:** Atlas M0 las permite, pero toda escritura ya pasa por la API, así
  que no aportan nada. Se descarta.
- **Pusher / Ably / Supabase Realtime:** servicio externo innecesario para esta escala. Se descarta.
- **Enviar los datos completos en el evento:** obliga a mantener el caché a mano y se pierde la
  consistencia con la API. Se descarta.
- **Interceptor global que publique por ruta:** toca menos archivos, pero es impreciso y esconde
  la regla dentro de una tabla de rutas. Se prefiere publicar desde cada caso de uso, junto a la
  lógica que cambia los datos.

## Consecuencias

- Cualquier cambio se refleja en todos los paneles abiertos en ~1 s.
- Sin cambios no hay tráfico, salvo el latido.
- **Escala:** el bus en memoria sirve para **una sola instancia**. Con varias réplicas hay que
  reemplazarlo por Redis pub/sub, detrás del mismo `RealtimePublisher`.
- **Deploy:** si el proxy vuelve a activar el buffering o la compresión, los avisos llegan tarde.
  Hay que revisarlo al cambiar la configuración de nginx o de Traefik.
- **Vercel serverless:** no mantiene conexiones abiertas. Ahí el panel funciona igual, pero sin
  tiempo real.
- **Si falla el tiempo real:** el panel vuelve a comportarse como antes (recarga al volver a la
  pestaña). Publicar un aviso nunca debe hacer fallar una escritura.
