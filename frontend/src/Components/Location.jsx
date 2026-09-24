import React from "react";
import { Element } from "react-scroll";

const Location = () => {
  return (
    <Element name="Ubicación">
    <section className="bg-gray-100 dark:bg-gray-900 py-[90px]">
      <div className="max-w-screen-xl px-4 mx-auto lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
        <div className="lg:col-span-7 lg:order-2 md:order-1 flex flex-col items-start space-y-8 md:w-full md:items-center md:py-4">
          <div className="w-full text-center">
            <h3 className="text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-extrabold tracking-tight leading-none text-gray-900 dark:text-white mb-4 md:mb-6">
              UBICADOS EN
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-lg">
                <div className="flex flex-col items-start">
                  <span className="text-gray-900 dark:text-white font-semibold">
                    HORARIO:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">10AM - 8PM</p>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-gray-900 dark:text-white font-semibold">
                    UBICACIÓN:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">
                    Av. San Luis 1859, San Borja 15021 - MultiMercado San Borja
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-lg">
                <div className="flex flex-col items-start">
                  <span className="text-gray-900 dark:text-white font-semibold">
                    TELÉFONO:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">
                    +51 924 548 268
                  </p>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-gray-900 dark:text-white font-semibold">
                    PUESTO:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">127</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 lg:order-1 md:order-2 flex justify-center items-center">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d289.9719361859796!2d-76.99659845096025!3d-12.085994834346701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c766de68b979%3A0x2e06fa302ff6b50!2sArmalytech!5e0!3m2!1ses-419!2spe!4v1731759574355!5m2!1ses-419!2spe"
            width="100%"
            height="400"
            className="rounded-lg shadow-lg "
            loading="lazy"
            title="Mapa"
          />
        </div>
      </div>
    </section>
    </Element>
  );
};

export default Location;
