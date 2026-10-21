# Contributing

Welcome aboard. Job Finder is a small app with one job: do the morning round of fifty-five job sites so nobody has to.
This page is the house rules. The linters know them by heart, so they will remind you anyway.

## Up and running

You need Node 22 and Docker. Then, the first time:

```bash
make setup
make db
make migrate
```

And every day:

```bash
make dev
```

That starts PostgreSQL in Docker, rebuilds the contract on save, and runs the API on http://localhost:3001 and the app on http://localhost:4201.
With no password set, development is open: no login screen. The database starts out empty, so fetch the first offers (`.env` holds the search profile; France Travail needs its keys):

```bash
make ingest
```

Type `make` alone to see every shortcut. Each one wraps a plain command, so make is a convenience, never a requirement.

## Try the real thing

The whole app from its Docker images, exactly as a server runs it, with a handful of fictitious offers, on http://localhost:8001:

```bash
make up
make e2e
```

Sign in with **job-finder-demo-password**. Done playing:

```bash
make down
```

## The daily loop

1. Write a test that fails.
2. Make it pass.
3. Tidy up, then run every check the CI runs:

```bash
make fix
make verify
```

Green here means green on GitHub. Coverage floors only ever go up: they sit just below today's figures in `backend/vitest.config.ts` and `frontend/angular.json`.

## What lives where

```text
contract/           the API types, imported by both halves (@job-finder/contract)
backend/            the API (NestJS, Prisma), which reads the job boards and keeps the offers
frontend/           the app (Angular), served by nginx, which relays /api to the backend
docs/deployment.md  what a server needs to run the images
compose.yaml        the whole app on your machine, also started by every delivery
```

The three folders are npm workspaces sharing one lockfile at the root, and one ESLint base (`eslint.base.js`) each extends. The backend and frontend READMEs hold the day-to-day commands of each side.

## How it works

**The whole domain lives in the `.env`**: job title, keywords, stack, commute area. It is validated by zod (`backend/src/shared/config/env.schema.ts`) and exposed as an injectable `SearchProfile`. Changing job needs no code.

**The job boards** (`backend/src/sources/`) share one contract, `JobSourceConnector`: `name`, `isEnabled()`, `fetchJobs()`, everything normalised into `RawJob`. Missing keys mean skipped, not failed. The 49 company career sites go through one connector iterating `sources/ats/companies.config.ts`.

**An ingestion** runs on a cron and on `POST /api/ingestion/run`: hard filters (title, stack, permanent contract, remote, commute area), an upsert on `(source, sourceId)` that merges the same offer published by two boards, then a purge of what was not seen for thirty days, favourites spared. Each board's run is recorded on its own, and the run reports to `INGESTION_HEARTBEAT_URL` when set.

**The commute area** is a driving-time polygon generated once by OpenRouteService and committed (`backend/src/geo/isochrone.geojson`): a point-in-polygon test at ingestion, no network call. Geocoding is cached in the database, failures included.

**The app** keeps the feed mounted: an offer opens in a child route, a column on a wide screen, a sheet on a phone. What changes in the panel travels back to the feed through `JobPatchBus` instead of a reload.

## House rules

- The interface speaks French, then English. Everything else is English: code, comments, tests, logs, docs.
- Small functions, names that explain themselves, no dead code, no magic numbers.
- Something moves to shared only when a second place needs it.
- One concern per file: constants, types, mappers and helpers each get their own, named after what they hold.
- Glyphs, icons and fonts are files in `frontend/public`, never drawn in a template.
- Never log a password, a session token or a sign-in request.

## Comments

Every declaration gets a one-sentence comment that says why, private ones included:

```ts
/**
 * Offers not seen for this long are dropped, unless they were favourited.
 */
```

The format follows the file:

```text
.ts .js .mjs                      /** ... */ above every declaration
.html                             <!-- ... --> above each meaningful block
.scss .css                        /* ... */ file header, one line above each rule
.svg                              <!-- ... --> header and groups
.sql                              -- ... above each statement
.env.example .yml Dockerfile      # === section headers, # ... above keys that need it
```

Spec files only comment their helpers and `describe` blocks. ESLint fails on a missing comment, no hard feelings.

## Backend rules

- One folder per feature, stacked in rows: `shared` at the top, then the features, each leaning only on the rows above it (backend README). Inside a feature, only services and repositories touch the database. `src/architecture.spec.ts` checks both.
- Constructor injection, typed settings through `ConfigService<Env, true>`, never `process.env` outside the config and the command-line tools of `src/cli`.
- One suffix per role: Nest's own (x.module.ts, x.controller.ts, x.service.ts, x.repository.ts, x.guard.ts, x.filter.ts, x.decorator.ts, x.token.ts), x.source.ts and x.mapper.ts for a job board, x.types.ts for shapes, x.constants.ts, x.spec.ts, and x.fixtures.ts for tests. Any other pure function lives in a file named after it.
- REST: plural nouns, `PATCH` for a flag, the contract type as the response.
- Errors are thrown as plain Nest exceptions, and only `ApiExceptionFilter` renders them, as `ApiError`. Error codes are a promise to the frontend.
- Prisma owns the schema. Never edit an applied migration: `npm run db:migrate -- --name <subject>` writes the next one.
- A job board without its keys is skipped, never failed. A board that answers an error fails alone: the others still run.

## Frontend rules

- Standalone OnPush components, signals, zoneless. Services use `inject()`, never constructor injection.
- Imports go core, then shared, then pages, never upwards, and a page never imports another page. Other folders are reached through the `@core`, `@shared` and `@pages` aliases. ESLint checks it.
- Data comes through `httpResource`, URLs through `API_ENDPOINTS`, types from the contract.
- One suffix per role: x.ts, x.html, x.scss, x.spec.ts, x.model.ts, x.constants.ts, x.utils.ts, and x.fixtures.ts for tests, plus Angular's own (x.routes.ts, x.config.ts, x.providers.ts, x.guards.ts, x.interceptor.ts, x.pipe.ts).
- Tailwind for layout only. Everything visual in BEM classes in the .scss, with tokens.
- Every animation respects reduced motion.

## Recipes

**A new job board**: its identifier in `JOB_SOURCES` (`contract/src/job-source.ts`) and in the `JobSourceType` enum of `backend/prisma/schema.prisma`, then `make migrate`. A folder `backend/src/sources/<board>/` with `<board>.constants.ts`, `<board>.types.ts` (the response shapes), `<board>.mapper.ts` and its spec (one result into a `RawJob`), and `<board>.source.ts` implementing `JobSourceConnector`. Register it in `sources/sources.module.ts`, add its keys to `env.schema.ts` and `backend/.env.example`, and its label to both `frontend/src/i18n/*.json`.

**A new endpoint**: its response type in `contract/src`, a service method and its spec, a controller method. On the frontend, its URL in `API_ENDPOINTS`.

**A new field of the contract**: the type in `contract/src` first, then the Prisma-to-contract mapping (`backend/src/jobs/job.mapper.ts`), then follow the compiler through the screens.

**A new table**: the model in `schema.prisma`, `make migrate`, a repository or service and its spec.

**A new screen**: a folder in `frontend/src/app/pages` with its files and spec, and a lazy route in `app.routes.ts`.

**A new text**: its key in both `fr.json` and `en.json`; a spec fails until they match.

**A new icon**: a single-colour SVG in `frontend/public/assets/icons/`, then its name in `ICON_NAMES`.

**A new commute area**: edit `SEARCH_AREA_*` in `backend/.env`, then `npm run geo:isochrone -w backend` (needs `ORS_API_KEY`) and commit the new `isochrone.geojson`.

## Shipping a release

Set the version of the three workspaces:

```bash
make version VERSION=1.2.0
```

Commit, then tag:

```bash
git tag v1.2.0 && git push origin v1.2.0
```

The delivery checks that the tag matches every version, publishes the images 1.2.0 and 1.2, and writes the GitHub release from the commits. Commit messages follow Conventional Commits (`feat(sources): add Jooble`), so the notes sort themselves.

## What the CI does

- **A pull request** runs the checks of the side it touches.
- **A push to main** runs both, builds both images, starts them with the demo offers, scans them, drives them with Playwright, and only then pushes them to GHCR. A failed commit has no image, so it can never be deployed.
- **CodeQL** reads the TypeScript and the workflows on every push and once a week.
- **Dependabot** groups the weekly updates of npm, the base images and compose, and the monthly ones of the actions.

## Banana peels

**npm install crashes**: npm 10.9 trips on jsdom. Use npm 11, which also honours `allowScripts`:

```bash
npx npm@11 install
```

**A new dependency needs its install script**: npm 11 skips them unless `allowScripts` in the root package.json says otherwise. Review it, then `npx npm@11 install-scripts approve <package>`.

**`Cannot find module '@job-finder/contract'`, or the old types**: the contract is consumed built. `npm run build -w @job-finder/contract`, or keep `make dev` running.

**`Cannot find module '../generated/prisma/client.js'`**: `npm run db:generate -w backend`.

**Playwright cannot find its browser**: install it once, from the frontend folder:

```bash
npx playwright install chromium
```

**429 on sign-in**: five attempts per fifteen minutes per address. `LOGIN_THROTTLE_ENABLED=false` in `backend/.env` turns it off locally, never on a server.

**The image scan fails a delivery**: it names the package. Bump it or the base image, never silence the scan.
