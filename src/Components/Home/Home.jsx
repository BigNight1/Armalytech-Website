import React from "react";
import Hero from "../Hero.jsx";
import RepairSection from "../RepairSection.jsx";
import WhyUs from "../WhyUs/WhyUs.jsx";
import Services from "../Services/Services.jsx";
import SuccessStories from "../SuccessStories/SuccessStories.jsx";
import CustomerReviews from "../CustomerReview/CustomerReviews.jsx";
import FAQ from "../FAQ/FAQ.jsx";
import Footer from "../Footer.jsx";
import { WhatsAppWidget } from "react-whatsapp-widget";
import "react-whatsapp-widget/dist/index.css";
import Location from "../Location.jsx";
import Navbar from "../Navbar/NavBar.jsx";
import VideosTikTok from "../TikToks/VideosTikTok.jsx";

const Home = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <RepairSection />
      <WhyUs />
      <Services />
      <SuccessStories />
      <VideosTikTok/>
      <Location />
      <CustomerReviews />
      <FAQ />
      <Footer />
      <WhatsAppWidget
        phoneNumber="+51924548268"
        companyName="Armalytech"
        message="Hola! ¿Cómo podemos ayudarte?"
        replyTimeText="Normalmente respondemos en unos minutos"
      />
    </div>
  );
};

export default Home;
