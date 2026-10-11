import { getDesde } from "../data/pricingData.js";
import "./repairs-section.css";

// Los montos "Desde" salen de data/pricingData.js (getDesde): aquí no se escribe ningún precio.
const SERVICES = [
  {
    id: 1,
    title: "Cambio de batería",
    description: "Reemplazo con batería de calidad para que tu equipo recupere autonomía.",
    price: getDesde("cambio-bateria"),
    img: "/reparaciones/baterylow.svg",
  },
  {
    id: 2,
    title: "Daño por agua",
    description: "Limpieza y secado profesional para rescatar tu equipo.",
    price: getDesde("danio-agua"),
    img: "/reparaciones/aguadaño.svg",
  },
  {
    id: 3,
    title: "Pantalla rota",
    description: "Cambio de pantalla o cristal con repuestos de calidad.",
    price: getDesde("reparacion-pantalla"),
    img: "/reparaciones/pantallarota.svg",
  },
  {
    id: 4,
    title: "Problemas de WiFi o Bluetooth",
    description: "Diagnóstico y reparación de conectividad inalámbrica.",
    price: getDesde("adicionales", "wifi-bluetooth"),
    img: "/reparaciones/nowifiorblue.svg",
  },
  {
    id: 5,
    title: "Parlantes dañados",
    description: "Reemplazo de parlantes para recuperar el audio.",
    price: getDesde("danio-agua", "parlante-microfono"),
    img: "/reparaciones/Parlantenotwork.svg",
  },
];

const FEATURED_SERVICE = SERVICES.find((s) => s.title === "Pantalla rota");

const RepairsSection = () => {
  const gridServices = SERVICES.filter((s) => s.title !== "Pantalla rota");

  return (
    <section className="repairs-section" id="repair">
      <div className="repairs-section__container">
        <div className="repairs-section__left">
          <p className="repairs-section__label">REPARAMOS TUS EQUIPOS</p>
          <h2 className="repairs-section__title">
            Hacemos la reparación
            <br />
            de tu celular sin estrés<span className="repairs-section__title-dot">.</span>
          </h2>
          {FEATURED_SERVICE && (
            <article className="repairs-section__featured">
              <div className="repairs-section__featured-icon-wrap">
                <img
                  src={FEATURED_SERVICE.img}
                  alt={FEATURED_SERVICE.title}
                  className="repairs-section__featured-icon"
                />
              </div>
              <h3 className="repairs-section__featured-title">{FEATURED_SERVICE.title}</h3>
              <p className="repairs-section__featured-desc">{FEATURED_SERVICE.description}</p>
              <p className="repairs-section__featured-price">
                Desde S/ {FEATURED_SERVICE.price}
                <span className="repairs-section__price-note"> · según el modelo</span>
              </p>
            </article>
          )}
        </div>
        <div className="repairs-section__right">
          <div className="repairs-section__grid">
            {gridServices.map((service) => (
              <article key={service.id} className="repairs-section__item">
                <div className="repairs-section__icon-wrap">
                  <img src={service.img} alt={service.title} className="repairs-section__icon" />
                </div>
                <h3 className="repairs-section__item-title">{service.title}</h3>
                <p className="repairs-section__item-desc">{service.description}</p>
                <p className="repairs-section__item-price">
                  Desde S/ {service.price}
                  <span className="repairs-section__price-note"> · según el modelo</span>
                </p>
              </article>
            ))}
          </div>
          <p className="repairs-section__note">
            Los precios &ldquo;desde&rdquo; son de referencia. El precio final depende del modelo de tu celular.
          </p>
        </div>
      </div>
    </section>
  );
};

export default RepairsSection;
