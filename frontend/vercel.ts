import { routes } from '@vercel/config/v1';
import type { VercelConfig } from '@vercel/config/v1';

// Admin panel backend (NestJS, `backend/`) route prefixes. Keep this in sync
// with the equivalent list in `vite.config.js` (dev proxy) if it changes.
const BACKEND_PREFIXES = [
  'health',
  'auth',
  'inventory',
  'cash-closings',
  'community',
  'staff',
  'account',
  'tickets',
  'technicians',
  'cobros',
  'sales',
  'webhooks',
];

// Single-path endpoints (no sub-routes): rewritten as exact matches.
// `events` is the realtime SSE stream (ADR 0028, `GET /api/events`).
const EXACT_PATHS = ['health', 'events'];

// vercel.json can't read env vars, so the backend origin used to be hardcoded
// as a literal placeholder (`REPLACE_WITH_BACKEND_URL`) that had to be edited
// by hand before every deploy. vercel.ts is compiled at build/deploy time, so
// it can read `BACKEND_URL` from the Vercel project env vars instead.
const rawBackendUrl = process.env.BACKEND_URL;

if (!rawBackendUrl) {
  throw new Error(
    'BACKEND_URL is not set. Configure it in the Vercel frontend project env vars ' +
      '(and in frontend/.env for local `vercel dev`) so vercel.ts can build the API rewrites.',
  );
}

const backendUrl = rawBackendUrl.replace(/\/+$/, '');

// Browser security headers for every response (C7 hardening). The nginx
// template (`nginx/default.conf.template`) ships the same set for the Docker
// deployment; keep both in sync when either changes. Vercel only honors HSTS
// over HTTPS, so the http:// origin keeps working.
// No CSP on purpose: the public site relies on inline JSON-LD, the Google Maps
// iframe and the WhatsApp widget, so a strict policy needs nonces and a visual
// QA pass. It is a documented pending item, not an oversight.
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // No includeSubDomains / preload: subdomains are not managed from this repo
  // and preload is effectively irreversible.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

// Client-only routes (src/App.jsx) that are NOT prerendered and must resolve to
// the SPA shell with HTTP 200. Anything else that is not a file or a prerendered
// page falls through to dist/404.html with HTTP 404 (real 404s, no soft 404).
// Keep in sync with the equivalent locations in nginx/default.conf.template and
// with the <Route> list in src/App.jsx.
const SPA_ONLY_PATHS = [
  '/admin',
  '/admin/:path*',
  '/ticket',
  '/ticket/:token',
  '/consultar-ticket',
  '/registrar/usuario',
];

// Private surfaces must never be indexed. They are NOT disallowed in robots.txt
// on purpose: a crawler that cannot fetch the page never sees the noindex.
const NOINDEX_SOURCES = [
  '/admin',
  '/admin/:path*',
  '/ticket',
  '/ticket/:path*',
  '/registrar/:path*',
];

export const config: VercelConfig = {
  headers: [
    routes.header('/(.*)', SECURITY_HEADERS),
    ...NOINDEX_SOURCES.map((source) =>
      routes.header(source, [{ key: 'X-Robots-Tag', value: 'noindex' }]),
    ),
  ],
  rewrites: [
    ...EXACT_PATHS.map((path) => routes.rewrite(`/api/${path}`, `${backendUrl}/api/${path}`)),
    ...BACKEND_PREFIXES.filter((prefix) => !EXACT_PATHS.includes(prefix)).map((prefix) =>
      routes.rewrite(`/api/${prefix}/:path*`, `${backendUrl}/api/${prefix}/:path*`),
    ),
    // SPA-only routes resolve to the empty SPA shell. Vercel checks the
    // filesystem before applying rewrites, so prerendered pages
    // (dist/precios.html, ...) are served first. There is deliberately NO
    // catch-all rewrite: any other unknown path gets dist/404.html with a real
    // HTTP 404. /api/contact is handled by the frontend/api/contact.js
    // serverless function and must NOT be rewritten to the backend. The shell
    // is dist/app-shell.html, written by scripts/prerender.mjs; index.html is
    // the prerendered home page and must not be used as the fallback.
    ...SPA_ONLY_PATHS.map((path) => routes.rewrite(path, '/app-shell')),
  ],
  // Prerendered pages are emitted as <route>.html; serve them extensionless
  // and keep one canonical URL per page (308 for /x.html and /x/).
  cleanUrls: true,
  trailingSlash: false,
  redirects: [
    // Legacy URLs that still receive impressions. 301 (not the 308 that
    // `permanent: true` yields) to match the documented SEO behavior.
    routes.redirect('/prices', '/precios', { statusCode: 301 }),
    routes.redirect('/p/precios', '/precios', { statusCode: 301 }),
  ],
};
