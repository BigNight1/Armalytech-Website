import React from "react";
import { Link } from "react-router-dom";
import ScrollToLink from "./ScrollToLink.jsx";
import { useLocation } from "react-router-dom";
import "./footer.css";

const SOCIAL_LINKS = [
  { name: "Instagram", img: "/redes_sociales/instagram.svg", href: "https://instagram.com/armalytech" },
  { name: "TikTok", img: "/redes_sociales/tik-tok.svg", href: "https://tiktok.com/@armalytech" },
  { name: "WhatsApp", img: "/redes_sociales/whatsapp.svg", href: "https://api.whatsapp.com/send/?phone=%2B51924548268&text&type=phone_number&app_absent=0" },
];

const FOOTER_LINKS = {
  useful: [
    { label: "Nosotros", href: "/sobre-nosotros" },
    { label: "Servicios", to: "services" },
    { label: "Precios", href: "/precios" },
    { label: "Redes", href: "/redes" },
  ],
  services: [
    { label: "Cambio de pantalla", href: "/servicios/reparacion-de-pantalla" },
    { label: "Cambio de batería", href: "/servicios/cambio-de-bateria" },
    { label: "Puerto de carga", href: "/servicios/reparacion-puerto-de-carga" },
    { label: "Daño por agua", href: "/servicios/restauracion-dano-de-agua" },
  ],
  support: [
    { label: "Garantía", href: "/contactanos" },
    { label: "Términos", href: "/contactanos" },
    { label: "Ayuda", href: "/contactanos" },
    { label: "Contacto", href: "/contactanos" },
  ],
};

const Footer = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const renderLink = (item) => {
    if (item.href) {
      return (
        <Link
          to={item.href}
          state={item.scrollTo ? { scrollTo: item.scrollTo } : undefined}
          className="footer__link"
        >
          {item.label}
        </Link>
      );
    }
    if (isHome) {
      return <ScrollToLink to={item.to} className="footer__link">{item.label}</ScrollToLink>;
    }
    return <Link to="/" state={{ scrollTo: item.to }} className="footer__link">{item.label}</Link>;
  };

  return (
    <footer className="footer" id="footer">
      <div className="footer__container">
        <div className="footer__grid">
          <div className="footer__col footer__col--brand">
            <a href="/" className="footer__logo">
              <img src="/logoarmalytech.webp" alt="ArmalyTech" className="h-10 rounded-full" />
            </a>
            <p className="footer__desc">
              Reparación de celulares y equipos tecnológicos en Lima. Calidad y garantía en cada servicio.
            </p>
            <div className="footer__socials">
              {SOCIAL_LINKS.map(({ name, img, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__social-link"
                  aria-label={name}
                >
                  <img src={img} alt="" className="footer__social-icon" />
                </a>
              ))}
            </div>
          </div>
          <div className="footer__col">
            <h3 className="footer__title">Enlaces útiles</h3>
            <ul className="footer__list">
              {FOOTER_LINKS.useful.map((item) => (
                <li key={item.label}>{renderLink(item)}</li>
              ))}
            </ul>
          </div>
          <div className="footer__col">
            <h3 className="footer__title">Servicios</h3>
            <ul className="footer__list">
              {FOOTER_LINKS.services.map((item) => (
                <li key={item.label}>{renderLink(item)}</li>
              ))}
            </ul>
          </div>
          <div className="footer__col">
            <h3 className="footer__title">Soporte</h3>
            <ul className="footer__list">
              {FOOTER_LINKS.support.map((item) => (
                <li key={item.label}>{renderLink(item)}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <p className="footer__copy">
            &copy; {new Date().getFullYear()} ArmalyTech. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
