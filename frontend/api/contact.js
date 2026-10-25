import nodemailer from "nodemailer";

// Vercel serverless function behind the public contact form.
//
// Hardening (C6, odd/tasks/seguridad-hardening-2026-10-25.md): this endpoint
// used to reflect any Origin with credentials and had no rate limit, so anyone
// could relay spam through the workshop SMTP account and Telegram bot. The
// form is same-origin and cookie-less, so a CORS allowlist plus a per-IP
// throttle is enough to close the relay.

const ALLOWED_ORIGINS = [
  "https://www.armalytech.com",
  "https://armalytech.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// Warm instances keep their Map forever; sweep expired entries once the map
// grows past this size so a long-lived lambda cannot leak memory.
const RATE_LIMIT_SWEEP_THRESHOLD = 1000;

const FIELD_LIMITS = { name: 80, phone: 30, email: 120, message: 2000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// In-memory, per-instance throttle: `{ count, windowStart }` per IP.
// A serverless deployment runs several instances and recycles them, so this
// stops a single abusive client hammering the same warm instance — it is NOT a
// global quota. A shared store (Redis/Upstash) would be needed for that.
const submissionsByIp = new Map();

function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

function applyCors(req, res) {
  // Only known origins get CORS headers. Requests without an Origin header
  // (same-origin fetches, curl) are not cross-origin, so there is nothing to
  // allow; the request itself is still processed.
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function sweepExpiredEntries(now) {
  for (const [ip, entry] of submissionsByIp) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      submissionsByIp.delete(ip);
    }
  }
}

// Returns true when the IP already used its quota inside the current window.
function isRateLimited(ip) {
  const now = Date.now();
  const entry = submissionsByIp.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    if (submissionsByIp.size >= RATE_LIMIT_SWEEP_THRESHOLD) {
      sweepExpiredEntries(now);
    }
    submissionsByIp.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Returns an error message (Spanish, shown by the form) or null when valid.
function validateSubmission({ name, phone, email, message }) {
  if (!name || !phone || !email) {
    return "Faltan campos requeridos: nombre, teléfono y email.";
  }
  if (name.length > FIELD_LIMITS.name) {
    return `El nombre no puede superar los ${FIELD_LIMITS.name} caracteres.`;
  }
  if (phone.length > FIELD_LIMITS.phone) {
    return `El teléfono no puede superar los ${FIELD_LIMITS.phone} caracteres.`;
  }
  if (email.length > FIELD_LIMITS.email) {
    return `El email no puede superar los ${FIELD_LIMITS.email} caracteres.`;
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Ingresa un email válido.";
  }
  if (message.length > FIELD_LIMITS.message) {
    return `El mensaje no puede superar los ${FIELD_LIMITS.message} caracteres.`;
  }
  return null;
}

async function sendTelegramMessage(data) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("Faltan variables de entorno para Telegram");
    return;
  }

  const { name, phone, email, message } = data;

  const text =
    `🔔 <b>NUEVO CONTACTO WEB</b> 🔔\n\n` +
    `👤 <b>Nombre:</b> ${escapeHtml(name)}\n` +
    `📱 <b>Teléfono:</b> ${escapeHtml(phone)}\n` +
    `📧 <b>Email:</b> ${escapeHtml(email)}\n\n` +
    `💬 <b>Mensaje:</b>\n${message ? escapeHtml(message) : "<i>(Sin mensaje)</i>"}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: "HTML"
      })
    });
  } catch (error) {
    console.error("Error enviando mensaje a Telegram:", error?.message || "error desconocido");
  }
}


export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método no permitido." });
  }

  let ip = "unknown";
  try {
    ip = getClientIp(req);
    if (isRateLimited(ip)) {
      // The quota is consumed even by invalid payloads on purpose: abusive
      // clients should not get free retries by sending garbage.
      return res.status(429).json({
        ok: false,
        message: "Demasiados envíos desde tu conexión. Espera unos minutos antes de volver a intentarlo.",
      });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const name = asTrimmedString(body.name);
    const phone = asTrimmedString(body.phone);
    const email = asTrimmedString(body.email);
    const message = asTrimmedString(body.message);

    const validationError = validateSubmission({ name, phone, email, message });
    if (validationError) {
      return res.status(400).json({ ok: false, message: validationError });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const toEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
    const html = `
      <h2>Nuevo mensaje desde el formulario de contacto</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${message ? escapeHtml(message) : "(Sin mensaje)"}</p>
      <hr>
      <p><small>Enviado desde ArmalyTech - Formulario de contacto</small></p>
    `;

    await Promise.allSettled([
      transporter.sendMail({
        from: process.env.SMTP_FROM || `"ArmalyTech Contacto" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `[Contacto] ${escapeHtml(name)} - ${escapeHtml(email)}`,
        html,
        replyTo: email,
      }),
      sendTelegramMessage({ name, phone, email, message })
    ]);

    return res.status(200).json({ ok: true, message: "Mensaje enviado correctamente." });
  } catch (err) {
    // Log only the message: transport errors can include the server response
    // and we never want SMTP credentials reaching the logs.
    console.error("Error enviando email:", err?.message || "error desconocido");
    return res.status(500).json({
      ok: false,
      message: "No se pudo enviar el mensaje. Intenta más tarde.",
    });
  }
}
