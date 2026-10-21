# Job Finder backend

The part that goes looking. Morning and evening a NestJS API reads seven job boards, keeps the permanent
developer offers within the commute, merges the ones published twice, and leaves PostgreSQL with a
list worth opening.

## Start

From the backend folder, the first time:

```bash
cp .env.example .env
```

Then every day:

```bash
make -C .. db
npm run db:migrate
npm run start:dev
```

The API answers on http://localhost:3001 and reloads on save. With no password set, development
is open: no login screen. Want the demo offers of the root `compose.yaml` in your own database?

```bash
npm run db:seed-demo
```

Then the password is **job-finder-demo-password**. No ingestion runs at boot
(`INGESTION_ON_STARTUP=false`); trigger one by hand:

```bash
curl -X POST http://localhost:3001/api/ingestion/run
```

## Before committing

```bash
npm run fix
npm run test:ci
```

The first one fixes lint and formatting, the second runs the tests once with the coverage floors of
`vitest.config.ts`. `make -C .. verify` runs every check the CI runs, on both halves.

## Run a single test

```bash
npx vitest run src/geo/is-within-area.spec.ts
npx vitest run -t "promotes the fuller description"
```

## Password

One shared password for the whole app, hashed (scrypt) in the database, never in a file. Set or
rotate it, which also signs everybody out:

```bash
make -C .. password                     # typed without echo, never on a command line
printf %s "$P" | npm run auth:set-password -- -
npm run auth:set-password -- --clear
```

In the image, the same tool is compiled:

```bash
read -rs P && printf %s "$P" | docker compose exec -T backend node dist/cli/set-password.js -
```

With no password, a production API (`NODE_ENV=production`) answers 503 `NO_PASSWORD` on every route
but the public ones: a forgotten password never publishes the API.

## Use your own PostgreSQL

Create the role and the database once. CREATEDB is for `prisma migrate dev`, which builds a shadow
database to check each new migration:

```bash
sudo -u postgres psql -c "CREATE ROLE jobfinder LOGIN CREATEDB PASSWORD 'jobfinder';" -c "CREATE DATABASE jobfinder OWNER jobfinder;"
```

Then point your .env at it:

```properties
DATABASE_URL=postgresql://jobfinder:jobfinder@localhost:5432/jobfinder
```

## Probes and alerts

```text
GET /livez     the process answers, without touching the database
GET /readyz    the API and its database: 200 {"status":"UP"}, or 503 {"status":"DOWN"}
```

Both sit outside `/api` and need no password. Set `INGESTION_HEARTBEAT_URL` to an uptime-kuma push
monitor and every ingestion run reports to it: `down` with the failing sources and their errors, or
`up` with the figures. No ping at all for too long means the cron itself stopped. Kuma does the
alerting; the API never talks to a chat.

## Packages

One folder per feature, stacked like a building: each row may lean on the rows above it, never on a
neighbour of its own row.

```text
shared                                   config, database client, errors, security, helpers
auth   geo   health   jobs   sources     sign-in, commute area, probes, offers, job boards
app-config   ingestion                   public settings, the fetch-filter-merge-purge run
cli                                      command-line tools: set-password, seed-demo, generate-isochrone
```

Inside a feature, a controller calls a service, and only services and repositories touch the
database. `src/architecture.spec.ts` checks both: a new folder gets its row there, or the build
complains.

Every board implements `JobSourceConnector` in `sources/<board>/` and normalises into `RawJob`;
CONTRIBUTING.md has the recipe for a new one. Errors are thrown as plain Nest exceptions and only
`shared/errors/api-exception.filter.ts` renders them, as `{ status, code, detail }`. The codes live
in the contract (`ApiErrorCode`): they are a promise to the frontend.

## Banana peels

**Types changed in the contract but not here**: the backend reads the compiled contract. Rebuild it:
`npm run build -w @job-finder/contract` from the root.

**`Cannot find module '../generated/prisma/client.js'`**: the Prisma client is generated, not
versioned. Run `npm run db:generate`.

**Prisma refuses `migrate dev`: permission denied to create database**: your role lacks CREATEDB,
see above.

**The geo filter keeps everything**: `src/geo/isochrone.geojson` is missing and the API fell back to
a straight-line radius (a warning at startup says so). Regenerate it with `npm run geo:isochrone`,
which needs `ORS_API_KEY`.

**A value of the .env is cut short**: an unquoted `#` starts a comment. Quote the lists that hold one
(`c#`).
