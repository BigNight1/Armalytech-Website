import { Route, Routes } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop.jsx";
import Home from "./Components/Home/Home.jsx";
import PricingPage from "./Components/PricingPage.jsx";
import ContactPage from "./Components/ContactPage/ContactPage.jsx";
import SobreNosotrosPage from "./Components/SobreNosotrosPage.jsx";
import Redes from "./Components/Redes/Redes.jsx";
import PageError from "./Components/PageError/PageError.jsx";
import ReparacionPantallaPage from "./Components/ServicePage/ReparacionPantallaPage.jsx";
import CambioBateriaPage from "./Components/ServicePage/CambioBateriaPage.jsx";
import ReparacionPuertoCargaPage from "./Components/ServicePage/ReparacionPuertoCargaPage.jsx";
import RestauracionDanoAguaPage from "./Components/ServicePage/RestauracionDanoAguaPage.jsx";
import ProblemasoftwarePage from "./Components/ServicePage/ProblemasoftwarePage.jsx";
import { WhatsAppWidget } from 'react-whatsapp-widget';
import 'react-whatsapp-widget/dist/index.css';

const CompanyIcon = () => (
  <img 
    src="/ArmalyTechlogopeq.webp" 
    alt="ArmalyTech Logo" 
    className="w-full h-full object-contain"
  />
);

function App() {
  return (
    <div>
      <ScrollToTop />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/precios" element={<PricingPage />} />
          <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
          <Route path="/contactanos" element={<ContactPage />} />
          <Route path="/redes" element={<Redes />} />
          <Route path="/servicios/reparacion-de-pantalla" element={<ReparacionPantallaPage />} />
          <Route path="/servicios/cambio-de-bateria" element={<CambioBateriaPage />} />
          <Route path="/servicios/reparacion-puerto-de-carga" element={<ReparacionPuertoCargaPage />} />
          <Route path="/servicios/restauracion-dano-de-agua" element={<RestauracionDanoAguaPage />} />
          <Route path="/servicios/problemas-de-software" element={<ProblemasoftwarePage />} />
          <Route path="*" element={<PageError />} />
        </Routes>
      </main>

      <div className="whatsapp-widget-wrapper fixed bottom-0 right-0 z-[99999]">
        <WhatsAppWidget 
          phoneNumber="51924548268" 
          companyName="ArmalyTech"
          message="¡Hola! ¿En qué podemos ayudarte?"
          replyTimeText="Normalmente responde en unos minutos"
          inputPlaceHolder="Escribe un mensaje"
          sendButtonText="Enviar"
          CompanyIcon={CompanyIcon}
        />
      </div>
    </div>
  );
}

export default App;
