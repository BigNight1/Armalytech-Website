import React from "react";
import { additionalServices } from "../data/pricingData.js";
import "./additional-services-section.css";

const AdditionalServicesSection = () => {
  const { intro, items } = additionalServices;

  return (
    <section className="additional-services">
      <div className="additional-services__inner">
        {/* Primer div: 2 columnas — título | intro */}
        <div className="additional-services__header">
          <h2 className="additional-services__title">
            Servicios adicionales
          </h2>
          <p className="additional-services__intro">
            {intro}
          </p>
        </div>

        {/* Otro div: los 4 servicios */}
        <div className="additional-services__list">
          {items.map((item, index) => (
            <div key={index} className="additional-services__item">
              <div className="additional-services__item-header">
                <h3 className="additional-services__item-name">{item.name}</h3>
                <span className="additional-services__item-line" aria-hidden="true" />
                <span className="additional-services__item-price">{item.price}</span>
              </div>
              <p className="additional-services__item-desc">
                {item.description}
              </p>
              <div className="additional-services__item-sep" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdditionalServicesSection;