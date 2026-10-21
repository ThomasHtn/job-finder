# Deploying Job Finder

Job Finder moves in with two Docker images and a short list of demands. Your server brings the rest: a domain, HTTPS, the secrets and the backups.
This repository ships no deployment on purpose. Each server writes its own compose (or chart, or PaaS settings) from this page. The root compose.yaml is a working example for your machine.

## The images

```bash
docker pull ghcr.io/thomashtn/job-finder-backend:sha-<commit>
docker pull ghcr.io/thomashtn/job-finder-frontend:sha-<commit>
```

Every push to main that passes the tests, the image scan and the browser tests publishes **sha-&lt;commit&gt;** and moves **main**. A release adds **x.y.z** and **x.y**. Deploy a sha or a release: a commit that failed its checks has no image, so it cannot sneak into production.

Both images run as a regular user, carry their own healthcheck and are happy with a read-only root filesystem plus a tmpfs on /tmp. Give the backend 512 MB: Node settles well below that, and a full ingestion of the fifty-five sources stays under it.

## The floor plan

```text
browser --HTTPS--> your proxy --> frontend :8080 --/api, /readyz--> backend :3000 --> postgres
                                                                    backend --> the job boards, your uptime monitor
```

One rule on your proxy: the domain goes to the frontend on port 8080. nginx serves the app and relays the API. It answers JSON in both bad cases: a 503 `UNAVAILABLE` when the backend naps, a 504 `TIMEOUT` when it takes more than five minutes (a manual ingestion may still be running).

- The backend and the database stay on the stack's private network. The backend needs outbound HTTPS: it reads the job boards, OpenRouteService is only used from a developer machine.
- Your proxy sets HSTS and the client address in `X-Forwarded-For`. nginx takes the real client from it (private ranges only), overwrites it for the backend, and sets every other security header, CSP included. A shared header set on the proxy would only duplicate them.
- The login throttle counts per client address: never let anything else than your proxy reach nginx.

## A database of its own

PostgreSQL 16 or newer, with a dedicated role and database:

```sql
CREATE ROLE jobfinder LOGIN PASSWORD 'change-me';
CREATE DATABASE jobfinder OWNER jobfinder;
```

The backend runs `prisma migrate deploy` before it starts listening: the tables are created on the first start and migrated on every update. Rolling an image back after a migration needs the dump taken before it.

## Settings

The backend reads its environment. A Compose .env to start from, kept at mode 600 and never committed:

```properties
# Database
DATABASE_URL=postgresql://jobfinder:change-me@postgres:5432/jobfinder

# Public origin of the app, for CORS
CORS_ORIGIN=https://jobs.example.com

# Job boards: France Travail is the backbone, the others are skipped while their keys are empty
FT_CLIENT_ID=
FT_CLIENT_SECRET=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
JOOBLE_API_KEY=
# Sources not run although configured. APEC answers every script with a bot challenge since October 2026
INGESTION_DISABLED_SOURCES=APEC

# Uptime-kuma push monitor (or any URL answering a GET), pinged after every ingestion; empty turns it off
INGESTION_HEARTBEAT_URL=
```

The search profile (`SEARCH_*`: job title, keywords, stack, commute area) is the whole domain of the app. Copy it from [backend/.env.example](../backend/.env.example), where every key is explained, and change it without touching the images. A new commute area also needs a new isochrone, generated in the repository (backend README).

These already have the right default. Leave them alone unless you know why:

```properties
NODE_ENV=production
PORT=3000
# Morning and evening, in UTC; a restart never replays a crawl
INGESTION_CRON=0 30 6,17 * * *
INGESTION_CRON_ENABLED=true
INGESTION_ON_STARTUP=false
# Offers published more than this many days ago are deleted, favourites excepted
INGESTION_MAX_AGE_DAYS=30
```

The frontend reads a single setting. Set it when the frontend sits on a network shared with other apps, where "backend" may well be somebody else's:

```properties
BACKEND_URL=http://jobfinder-backend:3000
```

## The password

The whole app sits behind one shared password, hashed in the database. Without one the backend answers 503 on every route, so a forgotten password never publishes the API. Set or rotate it (this signs every session out):

```bash
read -rs P && printf %s "$P" | docker compose exec -T backend node dist/cli/set-password.js -
```

Then open the site and try a wrong password. It should be refused.

## Backups

The favourites and the sessions live in the database; the offers come back by themselves on the next ingestion. Dump it every night, copy the dumps off the machine, and practise a restore now and then.

Dump:

```bash
docker compose exec -T postgres pg_dump -U jobfinder -d jobfinder --format=custom > jobfinder-$(date +%F).dump
```

Restore:

```bash
docker compose stop backend
docker compose exec -T postgres pg_restore -U jobfinder -d jobfinder --clean --if-exists --no-owner < jobfinder-<date>.dump
docker compose start backend
```

## Monitoring

Who to ask how things are going (jobfinder-backend stands for whatever name your stack gives the backend):

```text
https://<your-domain>/readyz                  API and database: the public uptime probe, "status":"UP"
https://<your-domain>/healthz                 proxy, TLS and nginx, without the backend
http://jobfinder-backend:3000/livez           the Node process is alive, even without the database
INGESTION_HEARTBEAT_URL                       pushed after every ingestion: up, or down with the failing sources
```

The heartbeat is the one that tells about the job boards. It is pushed after every run, scheduled or manual, with `status=up` or `status=down`, a short message naming the failing sources and their error, and the run's duration as `ping`. A source down for one run is often a hiccup: let your monitor wait for two in a row before it alerts. No push for fourteen hours means the ingestion itself has stopped.
