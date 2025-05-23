/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/acenternity-ui/**/*.js" // Agrega esta línea
  ],
  theme: {
    extend: {
      fontFamily: {
        OpenSans: ["Open Sans", "sans-serif"],
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
    require('acenternity-ui/plugin') // Agrega este plugin si es necesario
  ],
};
