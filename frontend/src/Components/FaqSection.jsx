import { useLayoutEffect, useRef, useState } from "react";
import "./faq-section.css";

const FAQ_ITEMS = [
  {
    id: 1,
    question: "¿Cuánto demora una reparación típica?",
    answer:
      "Depende del servicio. El puerto de carga toma de 1 a 2 horas y el cambio de pantalla de 2 a 3 horas; si dejas un adelanto, la pantalla se trae antes y el cambio toma menos de 1 hora. En el resto de servicios, confirmamos el tiempo después del diagnóstico gratuito.",
  },
  {
    id: 2,
    question: "¿Ofrecen garantía por sus servicios?",
    answer:
      "Sí. El repuesto que cambiamos tiene 3 meses de garantía, válida cuando la pieza falla por sí sola. No cubre equipos rotos, golpeados o caídos, contacto con agua u otros líquidos, ni mal uso o manipulación por terceros.",
  },
  {
    id: 3,
    question: "¿El diagnóstico tiene costo?",
    answer:
      "En muchos casos es gratuito. Si requiere revisión avanzada, te informamos antes de proceder.",
  },
  {
    id: 4,
    question: "¿Reparan todas las marcas y modelos?",
    answer:
      "Trabajamos con la mayoría de marcas. Si tu equipo es poco común, lo evaluamos y te confirmamos.",
  },
  {
    id: 5,
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos efectivo, transferencias y Yape/Plin. También otras opciones según disponibilidad.",
  },
];

const FaqSection = () => {
  const [openId, setOpenId] = useState(FAQ_ITEMS[0].id);
  const answerInnerRef = useRef(null);
  const [answerMaxHeight, setAnswerMaxHeight] = useState(0);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  useLayoutEffect(() => {
    if (!openId) {
      setAnswerMaxHeight(0);
      return;
    }

    const el = answerInnerRef.current;
    if (!el) return;

    const measure = () => {
      setAnswerMaxHeight(el.scrollHeight);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [openId]);

  return (
    <section className="faq-section" id="faq-section">
      <div className="faq-section__container">
        <div className="faq-section__left">
          <p className="faq-section__kicker">FAQ</p>
          <h2 className="faq-section__title">
            Resolvemos tus dudas al instante
            <span className="faq-section__title-dot">.</span>
          </h2>
          <p className="faq-section__subtitle">
            ¿Tienes preguntas? Revisa la sección de abajo.
          </p>

          <div className="faq-section__accordion">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={`faq-section__item ${isOpen ? "faq-section__item--open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-section__trigger"
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    id={`faq-question-${item.id}`}
                  >
                    <span className="faq-section__question">
                      {item.question}
                    </span>
                    <span className="faq-section__chevron" aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  <div
                    id={`faq-answer-${item.id}`}
                    className="faq-section__answer-wrap"
                    role="region"
                    aria-labelledby={`faq-question-${item.id}`}
                    style={{ maxHeight: isOpen ? `${answerMaxHeight}px` : "0px" }}
                  >
                    <div
                      className="faq-section__answer-inner"
                      ref={(el) => {
                        if (isOpen) answerInnerRef.current = el;
                      }}
                    >
                      <p className="faq-section__answer">{item.answer}</p>
                    </div>
                  </div>
                  <div className="faq-section__separator" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="faq-section__right">
          <div className="faq-section__image-wrap">
            <img
              src="/faq.webp"
              alt="Técnico ArmalyTech realizando reparación"
              width={735}
              height={490}
              className="faq-section__image"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
