require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3001;

// Solo acepta peticiones desde la URL que pongas en CORS_ORIGIN (ej. http://localhost:5173 o https://armalytech.com)
const corsOrigin = process.env.CORS_ORIGIN || false;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({
        ok: false,
        message: "Faltan campos requeridos: nombre, teléfono y email.",
      });
    }

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

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"ArmalyTech Contacto" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `[Contacto] ${escapeHtml(name)} - ${escapeHtml(email)}`,
      html,
      replyTo: email,
    });

    res.status(200).json({ ok: true, message: "Mensaje enviado correctamente." });
  } catch (err) {
    console.error("Error enviando email:", err);
    res.status(500).json({
      ok: false,
      message: "No se pudo enviar el mensaje. Intenta más tarde.",
    });
  }
});

function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
