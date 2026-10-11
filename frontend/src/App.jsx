import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop.jsx";
import Home from "./Components/Home/Home.jsx";
import PricingPage from "./Components/PricingPage.jsx";
import ContactPage from "./Components/ContactPage/ContactPage.jsx";
import PrivacyPage from "./Components/PrivacyPage/PrivacyPage.jsx";
import WarrantyPage from "./Components/WarrantyPage/WarrantyPage.jsx";
import SanBorjaPage from "./Components/ZonePage/SanBorjaPage.jsx";
import SobreNosotrosPage from "./Components/SobreNosotrosPage.jsx";
import Redes from "./Components/Redes/Redes.jsx";
import PageError from "./Components/PageError/PageError.jsx";
import ReparacionPantallaPage from "./Components/ServicePage/ReparacionPantallaPage.jsx";
import CambioBateriaPage from "./Components/ServicePage/CambioBateriaPage.jsx";
import ReparacionPuertoCargaPage from "./Components/ServicePage/ReparacionPuertoCargaPage.jsx";
import RestauracionDanoAguaPage from "./Components/ServicePage/RestauracionDanoAguaPage.jsx";
import ProblemasoftwarePage from "./Components/ServicePage/ProblemasoftwarePage.jsx";
import SearchTicketPage from "./ticket/SearchTicketPage.jsx";
import { WhatsAppWidget } from 'react-whatsapp-widget';
import 'react-whatsapp-widget/dist/index.css';

// Lazy-loaded so the admin panel bundle never ships to public-site visitors.
const AdminRoutes = lazy(() => import('./admin/AdminRoutes.jsx'));
// Lazy-loaded QR/NFC landing page (community registration, ADR 0012):
// its own bundle chunk, kept out of both the public and admin bundles.
const RegisterPage = lazy(() => import('./community/RegisterPage.jsx'));
// Lazy-loaded public ticket status page (R3, rediseno-panel): own bundle
// chunk, kept out of both the public and admin bundles.
const TicketPage = lazy(() => import('./ticket/TicketPage.jsx'));

const CompanyIcon = () => (
  <img 
    src="/ArmalyTechlogopeq.webp" 
    alt="ArmalyTech Logo" 
    className="w-full h-full object-contain"
  />
);

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isRegisterRoute = location.pathname.startsWith('/registrar');
  const hideSiteChrome = isAdminRoute || isRegisterRoute;

  // react-whatsapp-widget renders the current time (HH:MM) in its chat bubble,
  // which can never match between the prerendered HTML (build time) and the
  // first client render. Mount it only on the client, after hydration.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <div>
      <ScrollToTop />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/precios" element={<PricingPage />} />
          <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
          <Route path="/contactanos" element={<ContactPage />} />
          <Route path="/garantia" element={<WarrantyPage />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/reparacion-de-celulares-san-borja" element={<SanBorjaPage />} />
          <Route path="/redes" element={<Redes />} />
          <Route path="/servicios/reparacion-de-pantalla" element={<ReparacionPantallaPage />} />
          <Route path="/servicios/cambio-de-bateria" element={<CambioBateriaPage />} />
          <Route path="/servicios/reparacion-puerto-de-carga" element={<ReparacionPuertoCargaPage />} />
          <Route path="/servicios/restauracion-dano-de-agua" element={<RestauracionDanoAguaPage />} />
          <Route path="/servicios/problemas-de-software" element={<ProblemasoftwarePage />} />
          {/* Admin panel: no public NavBar/Footer, own layout, lazy-loaded bundle. */}
          <Route
            path="/admin/*"
            element={
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center bg-brand-navy">
                    <img src="/Armalytech_logo.png" alt="ArmalyTech" className="h-14 w-14 animate-pulse object-contain" />
                  </div>
                }
              >
                <AdminRoutes />
              </Suspense>
            }
          />
          {/* QR/NFC community registration landing (ADR 0012): no public
              NavBar/Footer/WhatsApp widget, own lazy-loaded bundle. */}
          <Route
            path="/registrar/usuario"
            element={
              <Suspense fallback={<div className="min-h-screen bg-brand-navy" />}>
                <RegisterPage />
              </Suspense>
            }
          />
          {/* Public ticket status page (ADR 0006 publicToken): own lazy
              chunk. Not part of hideSiteChrome — it reuses the site's own
              NavBar/Footer/WhatsApp widget (see TicketPage.jsx). */}
          <Route
            path="/ticket/:token"
            element={
              <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
                <TicketPage />
              </Suspense>
            }
          />
          <Route path="/consultar-ticket" element={<SearchTicketPage />} />
          <Route path="/ticket" element={<SearchTicketPage />} />
          <Route path="*" element={<PageError />} />
        </Routes>
      </main>

      {isMounted && !hideSiteChrome && (
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
      )}
    </div>
  );
}

export default App;
