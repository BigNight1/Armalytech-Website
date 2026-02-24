import React from "react";
import "./pricing-block.css";

const PricingBlock = ({ id, title, image, items, imageLeft }) => {
  return (
    <section id={id} className="pricing-block">
      <div className={`pricing-block__inner ${imageLeft ? "pricing-block__inner--img-left" : "pricing-block__inner--img-right"}`}>
        <div className="pricing-block__img-wrap">
          <img src={image} alt={title} className="pricing-block__img" />
        </div>
        <div className="pricing-block__content">
          <h2 className="pricing-block__title">{title}</h2>
          <ul className="pricing-block__list">
            {items.map((item, index) => (
              <li key={index} className="pricing-block__item">
                <div className="pricing-block__item-header">
                  <span className="pricing-block__item-name">{item.name}</span>
                  <span className="pricing-block__item-price">{item.price}</span>
                </div>
                <p className="pricing-block__item-desc">{item.description}</p>
              </li>
            ))}
          </ul>
          
        </div>
      </div>
    </section>
  );
};

export default PricingBlock;
