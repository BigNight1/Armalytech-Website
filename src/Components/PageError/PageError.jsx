import React from "react";
import { useNavigate } from "react-router-dom";

const PageError = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Error Image */}
      <img
        src="/error 404.webp"
        alt="Error 404"
        width={384}
        height={384}
        className="w-64 md:w-80 lg:w-96 mb-6"
      />
      {/* Error Message */}
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Página no encontrada</h2>
        <p className="mb-6">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        {/* Redirect Button */}
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
        >
          Volver a Inicio
        </button>
      </div>
    </div>
  );
};

export default PageError;
