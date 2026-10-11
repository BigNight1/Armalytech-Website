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

export const config: VercelConfig = {
  rewrites: [
    ...BACKEND_PREFIXES.map((prefix) =>
      prefix === 'health'
        ? routes.rewrite(`/api/${prefix}`, `${backendUrl}/api/${prefix}`)
        : routes.rewrite(`/api/${prefix}/:path*`, `${backendUrl}/api/${prefix}/:path*`),
    ),
    // SPA fallback: everything not under /api/ (including /api/contact,
    // which is handled by the frontend/api/contact.js serverless function
    // and must NOT be rewritten to the backend) resolves to index.html.
    routes.rewrite('/((?!api/).*)', '/'),
  ],
};
