import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import ScrollToLink from "../ScrollToLink.jsx";
import menuItems from "./menuItems.json";
import NavBarItem from "./NavBarItem.jsx";
import Icon1 from "../Icons/Icon1.jsx";
import { Ticket } from "lucide-react";
import "./navbar.css";

const PHONE_NUMBER = "+51 924548268";
const PHONE_LINK = "tel:+51924548268";
const EMAIL = "armalycell@gmail.com";
const EMAIL_LINK = "mailto:armalycell@gmail.com";

const SOCIAL_LINKS = [
  { name: "Instagram", img: "/redes_sociales/instagram.svg", href: "https://instagram.com/armalytech" },
  { name: "TikTok", img: "/redes_sociales/tik-tok.svg", href: "https://tiktok.com/@armalytech" },
  { name: "WhatsApp", img: "/redes_sociales/whatsapp.svg", href: "https://api.whatsapp.com/send/?phone=%2B51924548268&text&type=phone_number&app_absent=0" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleEsc = (e) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isMenuOpen, closeMenu]);

  const isHome = location.pathname === "/";

  return (
    <header className="relative w-full">
      <div className="navbar__top-bar bg-gray-900 text-white border-b border-gray-700/50">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 py-2">
          <a href={PHONE_LINK} className="text-sm text-gray-300 hover:text-white underline">
            {PHONE_NUMBER}
          </a>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map(({ name, img, href }) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100" aria-label={name}>
                <img src={img} alt={name} className="h-5 w-5 object-contain invert" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <nav className="bg-gray-900 border-b border-gray-700/50 w-full">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="flex items-center shrink-0">
            <img src="/logoarmalytech.webp" className="h-10 rounded-full" alt="ArmalyTech" />
          </a>
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/consultar-ticket"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold transition"
            >
              <Ticket size={14} />
              <span>Ticket</span>
            </Link>
            <button
              type="button"
              onClick={toggleMenu}
              className="inline-flex p-2 w-10 h-10 justify-center items-center text-gray-400 rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-600"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <Icon1/>
            </button>
          </div>
          <div className="hidden w-full md:flex md:w-auto md:flex-1 md:justify-center">
            <ul className="font-medium flex flex-col py-4 md:py-0 md:flex-row md:items-center md:gap-8 md:justify-center">
              {menuItems.map((item) => {
                if (item.route && item.to) {
                  return (
                    <li key={item.name}>
                      <Link to={item.to} className="block py-2 px-3 rounded md:p-0 cursor-pointer relative text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  );
                }
                if (item.to === "precios") {
                  return (
                    <li key={item.name}>
                      <Link to="/precios" className="block py-2 px-3 rounded md:p-0 cursor-pointer relative text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  );
                }
                if (item.to === "contacto") {
                  return (
                    <li key={item.name}>
                      <Link to="/contactanos" className="block py-2 px-3 rounded md:p-0 cursor-pointer relative text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  );
                }
                if (isHome) {
                  return <NavBarItem key={item.name} name={item.name} to={item.to} current={item.current} dark />;
                }
                return (
                  <li key={item.name}>
                    <Link to="/" state={{ scrollTo: item.to }} className="block py-2 px-3 rounded md:p-0 cursor-pointer relative text-gray-300 hover:text-white">
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              to="/consultar-ticket"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500 text-sm font-medium transition"
            >
              <Ticket size={15} />
              <span>Consultar Ticket</span>
            </Link>
            {isHome ? (
              <ScrollToLink
                to="contacto"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 shrink-0 cursor-pointer text-sm"
              >
                Solicitar cotización
              </ScrollToLink>
            ) : (
              <Link
                to="/contactanos"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 shrink-0 text-sm"
              >
                Solicitar cotización
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div
        className={`navbar-overlay${isMenuOpen ? " is-open" : ""}`}
        aria-hidden={!isMenuOpen}
        onClick={closeMenu}
      >
        <div className="navbar-overlay__panel" onClick={(e) => e.stopPropagation()}>
          <div className="navbar-overlay__header">
            <a href="/" onClick={closeMenu} className="flex items-center shrink-0">
              <img src="/logoarmalytech.webp" className="h-10 rounded-full" alt="ArmalyTech" />
            </a>
            <button
              type="button"
              className="navbar-overlay__close"
              onClick={closeMenu}
              aria-label="Cerrar menú"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="navbar-overlay__content">
            <ul className="navbar-overlay__links">
              <li>
                <Link
                  to="/consultar-ticket"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-400 font-semibold text-[1.125rem] mb-2 hover:bg-orange-500/25 transition"
                >
                  <Ticket size={18} className="text-orange-400" />
                  <span>Consultar Ticket</span>
                </Link>
              </li>
              {menuItems.map((item) => (
                <li key={item.name}>
                  {item.route && item.to ? (
                    <Link to={item.to} onClick={closeMenu} className="block py-2 text-[1.125rem] font-medium text-gray-300 hover:text-white">
                      {item.name}
                    </Link>
                  ) : item.to === "precios" ? (
                    <Link to="/precios" onClick={closeMenu} className="block py-2 text-[1.125rem] font-medium text-gray-300 hover:text-white">
                      {item.name}
                    </Link>
                  ) : item.to === "contacto" ? (
                    <Link to="/contactanos" onClick={closeMenu} className="block py-2 text-[1.125rem] font-medium text-gray-300 hover:text-white">
                      {item.name}
                    </Link>
                  ) : isHome ? (
                    <ScrollToLink to={item.to} onClick={closeMenu} className="block py-2 text-[1.125rem] font-medium text-gray-300 hover:text-white cursor-pointer">
                      {item.name}
                    </ScrollToLink>
                  ) : (
                    <Link to="/" state={{ scrollTo: item.to }} onClick={closeMenu} className="block py-2 text-[1.125rem] font-medium text-gray-300 hover:text-white">
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="navbar-overlay__contact">
              <a href={PHONE_LINK} onClick={closeMenu}>{PHONE_NUMBER}</a>
              <a href={EMAIL_LINK} onClick={closeMenu}>{EMAIL}</a>
            </div>
            <div className="navbar-overlay__socials">
              {SOCIAL_LINKS.map(({ name, img, href }) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name} onClick={closeMenu}>
                  <img src={img} alt="" />
                </a>
              ))}
            </div>
            {isHome ? (
              <ScrollToLink to="contacto" onClick={closeMenu} className="navbar-overlay__cta">
                Solicitar cotización
              </ScrollToLink>
            ) : (
              <Link to="/contactanos" onClick={closeMenu} className="navbar-overlay__cta">
                Solicitar cotización
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
