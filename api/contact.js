import nodemailer from "nodemailer";

function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
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
    console.error("Error enviando mensaje a Telegram:", error);
  }
}


export default async function handler(req, res) {
  // CORS: mismo dominio en Vercel, pero por si acaso
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método no permitido." });
  }

  try {
    const { name, phone, email, message } = req.body || {};

    if (!name || !phone || !email) {
      return res.status(400).json({
        ok: false,
        message: "Faltan campos requeridos: nombre, teléfono y email.",
      });
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
    console.error("Error enviando email:", err);
    return res.status(500).json({
      ok: false,
      message: "No se pudo enviar el mensaje. Intenta más tarde.",
    });
  }
}
