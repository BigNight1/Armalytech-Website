import React from "react";

const FaqItem = ({ index, question, answer }) => {
  return (
    <details key={index} className="faq-item">
      <summary>{question}</summary>
      <p>{answer}</p>
    </details>
  );
};

export default FaqItem;
