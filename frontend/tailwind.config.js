/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily:{
        OpenSans : ["Open Sans", "sans-serif"]
      },
      colors: {
        // Admin panel brand tokens (matches the public site's hero colors
        // in src/index.css: orange #f97316, navy #0f172a / #020617).
        brand: {
          orange: {
            DEFAULT: '#f97316',
            50: '#fff7ed',
            100: '#ffedd5',
            300: '#fdba74',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
          },
          navy: {
            DEFAULT: '#0f172a',
            light: '#1e293b',
            dark: '#020617',
          },
          ink: '#e2e8f0',
        },
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
    require('@tailwindcss/typography'),

]
}