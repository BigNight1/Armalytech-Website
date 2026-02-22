import React from 'react'

const Footer = () => {
  return (
    <footer className="p-4 bg-white sm:p-6 dark:bg-gray-800">
    <div className="mx-auto max-w-screen-xl">
        <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
                <a href="/" className="flex items-center">
                    <img src="/logoarmaly.webp" className="mr-2 h-14 rounded" alt="FlowBite Logo" />
                    <span className="self-center text-2xl  whitespace-nowrap dark:text-white font-extrabold font-OpenSans uppercase">Armalytech</span>
                </a>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-2">
                
                <div>
                    <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase dark:text-white">Siguenos</h2>
                    <ul className="text-gray-600 dark:text-gray-400 flex flex-col gap-3">
                        <li className="">
                            <a href="https://www.instagram.com/Armalytech/" target='_BLANK' className="hover:underline ">Instagram</a>
                        </li>
                        <li>
                            <a href="https://www.tiktok.com/@elsinamigos0?lang=es-419" target='_BLANK' className="hover:underline">TikTok</a>
                        </li>
                        <li>
                            <a href="/redes" target='_BLANK' className="hover:underline">Redes</a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase dark:text-white">Legal</h2>
                    <ul className="text-gray-600 dark:text-gray-400">
                        {/* <li class="mb-4">
                            <a href="#" class="hover:underline">Privacy Policy</a>
                        </li> */}
                        <li>
                            <a href="/terminos-y-condiciones" className="hover:underline">Terminos Y Condiciones</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <div className="border-t border-gray-800 mt-8 pt-2 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ArmalyTech. Todos los derechos reservados.</p>
        </div>
    </div>
</footer>
  )
}

export default Footer