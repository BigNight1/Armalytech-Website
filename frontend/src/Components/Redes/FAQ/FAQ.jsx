import React from "react";
import faqs from "./faqs.json";
import FaqItem from "./FaqItem";

const FAQ = () => {
  return (
    <div className="faq-list">
      {faqs.map((faq, index) => (
        <FaqItem key={index} index={index} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
};

export default FAQ;
