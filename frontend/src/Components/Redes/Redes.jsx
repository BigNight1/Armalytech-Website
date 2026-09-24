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
                width={120}
                height={40}
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

        <div className="redes-ubicacion">
          <h3 className="redes-ubicacion__title">Ubicación</h3>
          <div className="redes-ubicacion__mapa">
            <iframe
              title="Ubicación ArmalyTech"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d289.9719361859796!2d-76.99659845096025!3d-12.085994834346701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c766de68b979%3A0x2e06fa302ff6b50!2sArmalytech!5e0!3m2!1ses-419!2spe!4v1731759574355!5m2!1ses-419!2spe"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href="https://maps.app.goo.gl/kQnPY8uYo8E1EsZJ8"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn redes-ubicacion__link"
          >
            Abrir en Google Maps
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
