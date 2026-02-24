import React from "react";
import { Link } from "react-scroll";
import "./about-section.css";

const AboutSection = () => {
  return (
    <section className="about-section" id="sobre-nosotros">
      <div className="about-section__container">
        <div className="about-section__image-col">
          <div className="about-section__card">
            <div className="about-section__image-wrap">
              <img
                src="/aboutus.webp"
                alt="Celular reparado por ArmalyTech"
                className="about-section__image"
              />
            </div>
          </div>
        </div>
        <div className="about-section__text-col">
          <p className="about-section__kicker">SOBRE NOSOTROS</p>
          <h2 className="about-section__title">
            Devolvemos la vida a tus equipos<span className="about-section__title-dot">.</span>
          </h2>
          <p className="about-section__subtitle">
            Agenda tu reparación con ArmalyTech hoy y vive una experiencia rápida, clara y profesional.
          </p>
          <p className="about-section__body">
            En ArmalyTech reparamos celulares y equipos tecnológicos en Lima. Contamos con técnicos capacitados, diagnóstico preciso y soluciones que prolongan la vida útil de tu dispositivo.
          </p>
          <p className="about-section__body">
            Sabemos lo frustrante que es cuando un equipo falla. Por eso ofrecemos soluciones rápidas y confiables para que vuelvas a usar tu celular sin preocupaciones.
          </p>
          <Link
            to="sobre-nosotros"
            
            className="about-section__cta"
          >
            Conoce más
            <span className="about-section__cta-arrow"> →</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
