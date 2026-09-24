import React from "react";
import "./steps-section.css";

const STEPS = [
  {
    id: 1,
    label: "Contáctanos",
    description: "Escríbenos por WhatsApp, llamada o formulario para coordinar tu atención y contarnos el problema.",
    img: "/trabajamos/primero.svg",
  },
  {
    id: 2,
    label: "Trae tu equipo",
    description: "Acércate a nuestro punto de atención para diagnóstico. Revisamos tu equipo y te damos una solución clara.",
    img: "/trabajamos/segundo.svg",
  },
  {
    id: 3,
    label: "Listo y garantizado",
    description: "Realizamos la reparación y te avisamos apenas esté listo. Entregamos con prueba y garantía según el servicio.",
    img: "/trabajamos/tercero.svg",
  },
];

const StepsSection = () => {
  return (
    <section className="steps-section" id="como-trabajamos">
      <div className="steps-section__container">
        <div className="steps-section__left">
          <div className="steps-section__content">
            <p className="steps-section__kicker">CÓMO TRABAJAMOS</p>
            <h2 className="steps-section__title">
              3 pasos para reparar<span className="steps-section__title-dot">.</span>
            </h2>
            <p className="steps-section__subtitle">
              Solo confía en nuestros técnicos.
            </p>
            <ul className="steps-section__list">
              {STEPS.map((step) => (
                <li key={step.id} className="steps-section__item">
                  <div className="steps-section__icon-box" aria-hidden="true">
                    <img src={step.img} alt="" className="steps-section__step-icon" />
                  </div>
                  <div className="steps-section__item-body">
                    <h3 className="steps-section__item-title">
                      Paso <span className="steps-section__item-number">{step.id}.</span>{" "}
                      {step.label}
                    </h3>
                    <p className="steps-section__item-desc">{step.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="steps-section__right">
          <div className="steps-section__image-wrap">
            <img
              src="/howwework.webp"
              alt="Como trabajamos"
              width={735}
              height={490}
              className="steps-section__image"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
