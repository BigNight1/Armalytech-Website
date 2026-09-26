# Self-hosted image for the NestJS admin backend (Dokploy).
# Vercel keeps using api/index.ts; this image runs the regular HTTP server
# from src/main.ts.

FROM node:22-bookworm-slim AS build
WORKDIR /app

# bcrypt/better-sqlite3 may need to compile native bindings.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Same pnpm major as the lockfile / pnpm-workspace.yaml (`allowBuilds`).
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# mongodb-memory-server is only used by tests; skip its MongoDB download.
ENV MONGOMS_DISABLE_POSTINSTALL=1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000

# tsconfig has no rootDir and also compiles api/, so the entry lands in dist/src.
CMD ["node", "dist/src/main.js"]
