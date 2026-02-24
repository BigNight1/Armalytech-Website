import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../Hero.jsx";
import RepairsSection from "../RepairsSection.jsx";
import AboutSection from "../AboutSection.jsx";
import StepsSection from "../StepsSection.jsx";
import ServicesPreviewSection from "../ServicesPreviewSection.jsx";
import FaqSection from "../FaqSection.jsx";
import CtaSection from "../CtaSection.jsx";
import ContactSection from "../ContactSection.jsx";
import Footer from "../Footer.jsx";
import { WhatsAppWidget } from "react-whatsapp-widget";
import "react-whatsapp-widget/dist/index.css";
import Navbar from "../Navbar/NavBar.jsx";

const Home = () => {
  const { state } = useLocation();

  useEffect(() => {
    const scrollTo = state?.scrollTo;
    if (scrollTo) {
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollTo);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }, [state?.scrollTo]);

  return (
    <div>
      <div className="hero-container relative">
        <Navbar />
        <Hero />
      </div>
      <RepairsSection />
      <AboutSection />
      <StepsSection />
      <ServicesPreviewSection />
      <CtaSection />
      <FaqSection />
      <ContactSection />
      <Footer />
      {/* <WhatsAppWidget
        phoneNumber="+51924548268"
        companyName="Armalytech"
        message="Hola! ¿Cómo podemos ayudarte?"
        replyTimeText="Normalmente respondemos en unos minutos"
      /> */}
    </div>
  );
};

export default Home;
