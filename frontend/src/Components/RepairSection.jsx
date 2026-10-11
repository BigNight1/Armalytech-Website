
const RepairSection = () => {
    const whatsappNumber = "+51924548268";
    const message = "Hola, estoy interesado en cotizar la reparación de mi celular.";
  
    const whatsappLink = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
  return (
    <section className="bg-gray-100 dark:bg-gray-900 py-12" id="repair">
      <div className="max-w-screen-xl px-4 mx-auto flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 text-center lg:text-left lg:pr-8">
          <h2 className="text-3xl font-extrabold leading-tight text-gray-900 dark:text-white mb-4">
            ¿Se dañó tu celular? Nosotros lo reparamos
          </h2>
          <p className="max-w-2xl mb-6 font-normal text-lg text-gray-700 dark:text-gray-300">
            No importa la marca o el modelo, nuestros expertos están listos para reparar tu celular con repuestos 100% originales y servicio de calidad.
          </p>
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
          >
            Cotiza reparación ahora
          </a>
        </div>
        <div className="lg:w-[400px] mt-8 lg:mt-0">
          <img src="/iphone-xRoto.webp" alt="iPhone roto" width={400} height={300} className="w-full h-auto rounded-lg shadow-md" />
        </div>
      </div>
    </section>
  );
};

export default RepairSection;
