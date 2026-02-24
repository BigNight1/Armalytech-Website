import { Route, Routes } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop.jsx";
import Home from "./Components/Home/Home.jsx";
import PricingPage from "./Components/PricingPage.jsx";
import ContactPage from "./Components/ContactPage/ContactPage.jsx";
import SobreNosotrosPage from "./Components/SobreNosotrosPage.jsx";
import Redes from "./Components/Redes/Redes.jsx";
import PageError from "./Components/PageError/PageError.jsx";

function App() {
  return (
    <div>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/precios" element={<PricingPage />} />
        <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
        <Route path="/contactanos" element={<ContactPage />} />
        <Route path="/redes" element={<Redes />} />
        <Route path="*" element={<PageError />} />
      </Routes>
    </div>
  );
}

export default App;
