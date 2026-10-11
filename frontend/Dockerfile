# Self-hosted image for the public site + admin panel SPA (Dokploy).
# Vercel keeps using vercel.ts; here nginx serves dist/ and proxies the
# admin-panel API prefixes to the backend (BACKEND_URL, read at startup).

FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS runtime

# Backend origin without trailing slash, e.g. http://backend-service:3000
# or https://api.example.com. Override it in the Dokploy environment.
ENV BACKEND_URL=http://localhost:3000

# The official nginx image runs envsubst on /etc/nginx/templates/*.template.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
