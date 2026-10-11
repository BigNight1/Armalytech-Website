import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'

// Build-time SSR entry used by scripts/prerender.mjs. It renders the same tree
// as src/main.jsx, swapping BrowserRouter for StaticRouter, and returns the
// markup plus the Helmet tags collected during the render.
export function render(url) {
  const helmetContext = {}
  const html = renderToString(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </React.StrictMode>,
  )
  return { html, helmet: helmetContext.helmet }
}
