# syntax=docker/dockerfile:1

# Base images are pinned by version and digest for reproducible builds; Dependabot bumps both.
# Build context is the repository root: the workspaces share one lockfile, and the API needs the
# contract. Dockerfile.dockerignore, next to this file, lets in only what the image is built from.

# ---- Dependencies stage -----------------------------------------------------
# npm 11, as packageManager says: unlike the npm 10 of the base image, it only runs the install
# scripts the root allowScripts approves. Every workspace manifest is copied because npm ci checks
# them all against the lockfile, before the sources, so this layer only changes with the dependencies.
FROM node:22.23.3-alpine3.24@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS deps
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY contract/package.json contract/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npx --yes npm@11.21.1 ci --workspace contract --workspace backend

# ---- Build stage ------------------------------------------------------------
# Quality gates (lint, tests, coverage) run in CI before an image is built, so this stage only builds:
# the contract, the Prisma client into src/generated, then the API and its command-line tools.
FROM deps AS build
COPY contract contract
COPY backend backend
RUN npm run build --workspace contract \
  && npm run db:generate --workspace backend \
  && npm run build --workspace backend

# ---- Production dependencies stage -----------------------------------------
# Same install without the dev tools. The Prisma CLI stays: it applies the migrations at startup.
FROM deps AS prod-deps
RUN npx --yes npm@11.21.1 ci --workspace contract --workspace backend --omit=dev

# ---- Runtime stage ----------------------------------------------------------
FROM node:22.23.3-alpine3.24@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS runtime

# Alpine security fixes land days before a rebuilt base image: applied at build time, so the image
# scan of the delivery only fails on what nobody can fix yet. npm and corepack are removed: nothing
# installs at runtime, and their bundled packages would only widen what the scan has to clear.
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Unprivileged user with a fixed numeric id, so a runtime can check it is not root without a passwd lookup.
RUN addgroup -S -g 10001 jobfinder && adduser -S -D -H -u 10001 -G jobfinder jobfinder

WORKDIR /app
COPY --from=prod-deps /workspace/node_modules node_modules
COPY --from=build /workspace/package.json ./
COPY --from=build /workspace/contract/package.json contract/
COPY --from=build /workspace/contract/dist contract/dist
COPY --from=build /workspace/backend/package.json /workspace/backend/prisma.config.ts backend/
COPY --from=build /workspace/backend/prisma backend/prisma
COPY --from=build /workspace/backend/dist backend/dist

USER 10001:10001
WORKDIR /app/backend

# Read-only root filesystem friendly: Prisma's update check would otherwise write a cache file.
ENV NODE_ENV=production PORT=3000 CHECKPOINT_DISABLE=1 PRISMA_HIDE_UPDATE_MESSAGE=1

# The API and its probes /livez and /readyz; only the frontend's nginx should ever reach it.
EXPOSE 3000

# Probes the database too, like the uptime probe. No curl in this image: node's fetch does it.
# The start period covers `prisma migrate deploy`, probed every 2 s so dependants start as soon as it is up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --start-interval=2s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/readyz`).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# Migrations first, so the API never serves an older schema; exec hands PID 1 and the signals to node.
ENTRYPOINT ["sh", "-c", "../node_modules/.bin/prisma migrate deploy && exec node dist/main.js"]
