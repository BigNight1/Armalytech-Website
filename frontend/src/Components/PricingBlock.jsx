import React from "react";
import { Link } from "react-router-dom";
import "./pricing-block.css";

const PricingBlock = ({ id, title, image, items, imageLeft, link }) => {
  return (
    <section id={id} className="pricing-block">
      <div className={`pricing-block__inner ${imageLeft ? "pricing-block__inner--img-left" : "pricing-block__inner--img-right"}`}>
        <div className="pricing-block__img-wrap">
          <img src={image} alt={title} width={400} height={300} className="pricing-block__img" />
        </div>
        <div className="pricing-block__content">
          <h2 className="pricing-block__title">{title}</h2>
          <ul className="pricing-block__list">
            {items.map((item, index) => (
              <li key={index} className="pricing-block__item">
                <div className="pricing-block__item-header">
                  <span className="pricing-block__item-name">{item.name}</span>
                  <span className="pricing-block__item-line" aria-hidden="true" />
                  <span className="pricing-block__item-price">{item.price}</span>
                </div>
                <p className="pricing-block__item-desc">{item.description}</p>
              </li>
            ))}
          </ul>
          {link && (
            <div style={{ marginTop: '1.5rem' }}>
              <Link 
                to={link} 
                style={{ 
                  color: '#b8380a', 
                  fontWeight: '600', 
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Ver detalles y ofertas especiales →
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PricingBlock;
