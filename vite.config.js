import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from '@prerenderer/rollup-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: [
        '/',
        '/precios',
        '/sobre-nosotros',
        '/contactanos',
        '/redes',
        '/servicios/reparacion-de-pantalla',
        '/servicios/cambio-de-bateria',
        '/servicios/reparacion-puerto-de-carga',
        '/servicios/restauracion-dano-de-agua',
        '/servicios/problemas-de-software',
      ],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        renderAfterDocumentEvent: 'render-event',
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
