# Backend - API formulario de contacto

API en Node.js (Express + Nodemailer) para enviar los mensajes del formulario de contacto por email.

## Instalación

```bash
cd Backend
npm install
```

## Configuración

1. Copia el archivo de ejemplo y edítalo con tus datos:

```bash
cp .env.example .env
```

2. En `.env` configura tu servidor SMTP. Ejemplo con **Gmail**:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=tu-email@gmail.com`
   - `SMTP_PASS=contraseña-de-aplicacion` (no la contraseña normal; en Gmail: Cuenta → Seguridad → Contraseñas de aplicación)
   - `CONTACT_EMAIL`: email donde quieres recibir los mensajes (puede ser el mismo que SMTP_USER)

Para otros proveedores (Outlook, SendGrid, etc.) cambia `SMTP_HOST`, `SMTP_PORT` y si usan SSL `SMTP_SECURE=true`.

## Ejecutar

```bash
npm run dev
```

El servidor queda en `http://localhost:3001`. El frontend (Vite) debe apuntar a esta URL; por defecto ya usa `http://localhost:3001` si no defines `VITE_API_URL`.

En producción, despliega el Backend y en el frontend define:

```
VITE_API_URL=https://tu-dominio-api.com
```

## CORS

En `.env` del Backend defines **`CORS_ORIGIN`** con la URL exacta del frontend que puede llamar al API (ej. `http://localhost:5173` o `https://armalytech.com`). Solo esa origen será aceptada.

**Por qué no ves que “falle” CORS en desarrollo:**  
Si el frontend **no** tiene `VITE_API_URL`, usa el **proxy de Vite**: el navegador pide `/api/contact` a tu mismo origen (ej. `http://localhost:5173`) y Vite reenvía al backend. El navegador nunca habla con `localhost:3001`, así que **CORS no se aplica** (no hay petición cross-origin).

**Para probar que CORS sí funciona:**

1. En la **raíz del proyecto frontend** crea o edita `.env` y pon:
   ```
   VITE_API_URL=http://localhost:3001
   ```
2. Reinicia el frontend (`npm run dev`).
3. En el Backend, en `.env`, pon por ejemplo `CORS_ORIGIN=http://localhost:5175` (una URL que **no** sea la que usas, ej. 5173).
4. Abre la web en `http://localhost:5173` y envía el formulario. Deberías ver error en consola (CORS bloqueado) y el mensaje no se enviará.
5. Cambia `CORS_ORIGIN` a `http://localhost:5173`, reinicia el Backend y vuelve a enviar: debería funcionar.

En **producción**, frontend y backend suelen estar en dominios distintos, y ahí CORS sí se aplica siempre; por eso es importante tener `CORS_ORIGIN` con la URL real del sitio.

## Probar en Postman

1. Arranca el servidor: `npm run dev` (debe decir "Servidor escuchando en http://localhost:3001").
2. En Postman:
   - **Método:** POST
   - **URL:** `http://localhost:3001/api/contact`
   - **Headers:** `Content-Type` = `application/json`
   - **Body** → pestaña "raw" → tipo "JSON" → pega:
   ```json
   {
     "name": "Juan Pérez",
     "phone": "+51 999 888 777",
     "email": "juan@ejemplo.com",
     "message": "Quiero cotizar reparación de pantalla."
   }
   ```
3. Envía (Send). Deberías recibir `{ "ok": true, "message": "Mensaje enviado correctamente." }` y el correo en la bandeja de `CONTACT_EMAIL`.

---

## Revisar tu `.env`

- **Sin espacios en valores.** Si algún valor tiene espacios (ej. contraseña de aplicación de Gmail), ponlo entre comillas:
  ```env
  SMTP_PASS="abcd efgh ijkl mnop"
  ```
- **Gmail:** usa la contraseña de aplicación de 16 caracteres (Cuenta Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación). Puedes pegarla con o sin espacios; si tiene espacios, usa comillas como arriba.
- **SMTP_FROM:** el email entre `< >` debe ser el mismo que `SMTP_USER` (ej. `"ArmalyTech Contacto <armalycell@gmail.com>"`).
- No subas `.env` a Git (ya está en `.gitignore`). Los datos reales solo en tu copia local en `.env`.

---

## Endpoint

- **POST** `/api/contact`  
  Body (JSON): `{ "name", "phone", "email", "message" }`  
  Responde `{ "ok": true, "message": "..." }` o error 400/500.
