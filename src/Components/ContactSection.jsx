import React, { useState } from "react";
import "./contact-section.css";

// Placeholders: reemplazar con datos reales
const PHONE = "+51 924 548 268";
const PHONE_LINK = "tel:+51924548268";
const EMAIL = "armalytech@email.com";
const ADDRESS = "Av. Ejemplo 123, Lima"; // Placeholder: reemplazar con dirección real
const HORARIO = "Lun–Sáb 9AM – 7PM";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: enviar formulario (ej. endpoint o WhatsApp)
  };

  return (
    <section className="contact-section" id="contacto">
      <div className="contact-section__bg-pattern" aria-hidden="true" />
      <div className="contact-section__container">
        <div className="contact-section__left">
          <p className="contact-section__kicker">CONTACTO</p>
          <h2 className="contact-section__title">
            Contáctanos ahora para reparaciones rápidas<span className="contact-section__title-dot">.</span>
          </h2>
          <p className="contact-section__subtitle">
            ¿Listo para sentir la diferencia ArmalyTech?
          </p>
          <p className="contact-section__intro">
            Escríbenos y agenda tu diagnóstico o reparación. Nuestro equipo te responderá a la brevedad.
          </p>

          <div className="contact-section__blocks">
            <div className="contact-section__block">
              <h3 className="contact-section__block-title">Soporte</h3>
              <a href={PHONE_LINK} className="contact-section__block-link">
                {PHONE}
              </a>
              {/* <a href={`mailto:${EMAIL}`} className="contact-section__block-link">
                {EMAIL}
              </a> */}
            </div>
            <div className="contact-section__block">
              <h3 className="contact-section__block-title">Visítanos</h3>
              <p className="contact-section__block-text">{ADDRESS}</p>
              <p className="contact-section__block-text">{HORARIO}</p>
            </div>
          </div>

          <div className="contact-section__cta-mini">
            <img src="/contacto/celrevive.svg" alt="Celular revivido" className="w-10" />
            <div>
              <p className="contact-section__cta-mini-title">¿Quieres revivir tu equipo?</p>
              <p className="contact-section__cta-mini-desc">Completa el formulario de la derecha.</p>
            </div>
          </div>
        </div>

        <div className="contact-section__right">
          <div className="contact-section__card">
            <form className="contact-section__form" onSubmit={handleSubmit}>
              <label className="contact-section__label">
                Nombre <span className="contact-section__required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="contact-section__input"
                placeholder="Tu nombre"
              />
              <label className="contact-section__label">
                Teléfono <span className="contact-section__required">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="contact-section__input"
                placeholder="+51 999 999 999"
              />
              <label className="contact-section__label">
                Email <span className="contact-section__required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="contact-section__input"
                placeholder="tu@email.com"
              />
              <label className="contact-section__label">Mensaje</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="contact-section__textarea"
                placeholder="Describe tu consulta o el problema de tu equipo..."
                rows={5}
              />
              <button type="submit" className="contact-section__submit">
                Solicitar cotización
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
