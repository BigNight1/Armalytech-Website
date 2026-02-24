import React from "react";
import "./redes.css";
import FAQ from "./FAQ/FAQ";

const Redes = () => {
  return (
    <div className="fondo">
      <div className="Box_Redes">
        <div className="text-center">
          <div className="flex justify-center">
            <a href="/" rel="noopener noreferrer">
              <img
                src="/logoarmaly.webp"
                alt="Logo de armalytech"
                className="redes-logo"
              />
            </a>
          </div>

          <div className="sub-description">
            <h3 className="color-titulo">ARMALY<span className="color-tech">TECH</span></h3>
            <span className="text-white">Servicio tecnico de celulares</span>
            <span className="text-white">Lima - Peru</span>
          </div>
        </div>
        <div className="box-redes">
          <a
            href="https://www.instagram.com/armalytech/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            Instagram
          </a>
          <a
            href="https://api.whatsapp.com/send/?phone=%2B51924548268&text&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            WhatsApp
          </a>
          <a
            href="https://www.tiktok.com/@armalytech"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            TikTok
          </a>
          <a
            href="https://www.armalytech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            Página Web
          </a>
        </div>
        <div className="redes-faq-wrapper">
          <FAQ />
        </div>
      </div>
    </div>
  );
};

export default Redes;
