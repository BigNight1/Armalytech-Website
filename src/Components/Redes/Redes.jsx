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
                className="h-[125px] rounded-full "
              />
            </a>
          </div>

          <div className="sub-description">
            <h3 className="color-titulo">ARMALYTECH</h3>
            <span className="text-white">Servicio tecnico de celulares</span>
            <span className="text-white">Lima - Peru</span>
          </div>
        </div>
        <div className="box-redes">
          {/* Enlace a Instagram */}
          <a
            href="https://www.instagram.com/armalytech/" /* Cambia por la URL de Instagram */
            target="_blank"
            rel="noopener noreferrer"
            className="caja-redes"
          >
            INSTAGRAM
          </a>

          {/* Enlace a WhatsApp */}
          <a
            href="https://api.whatsapp.com/send/?phone=%2B51924548268&text&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="caja-redes"
          >
            WHATSAPP
          </a>
          <a
            href="https://www.tiktok.com/@armalytech" /* Cambia por la URL de Instagram */
            target="_blank"
            rel="noopener noreferrer"
            className="caja-redes"
          >
            TIKTOK
          </a>
          <a
            href="https://www.armalytech.com" /* Cambia por la URL de Instagram */
            target="_blank"
            rel="noopener noreferrer"
            className="caja-redes"
          >
            Pagina Web
          </a>
        </div>
        {/* PREGUNTAS Y RESPUESTAS  */}
        <FAQ />
      </div>
    </div>
  );
};

export default Redes;
