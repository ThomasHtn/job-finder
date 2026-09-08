# Build context is the repo root: the API depends on packages/shared.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @job-finder/shared \
  && npm run db:generate -w api \
  && npm run build -w api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# devDependencies are kept: the Prisma CLI runs migrations at startup.
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts apps/api/
COPY --from=build /app/apps/api/package.json apps/api/

# Nothing here needs root: run as the unprivileged user shipped with the image.
RUN chown -R node:node /app
USER node

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
