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
    </div>
  );
}

export default App;
