#!/usr/bin/env bash
# Regenerates the README media from the real app on fictitious offers:
# docs/media/tour.webp and docs/media/screen-*.png. See tools/tour/README.md.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TOUR="$ROOT/tools/tour"
MEDIA="$ROOT/docs/media"

# Ports of their own, so a running `make dev` keeps 3001 and 4201.
API_PORT=3101
APP_PORT=4301

# Must match TOUR_PASSWORD in tour.constants.mjs.
PASSWORD='job-finder-tour-password'

# A throwaway database next to the development one, dropped on exit.
DEV_URL="$(grep -E '^DATABASE_URL=' "$ROOT/backend/.env" | cut -d= -f2-)"
TOUR_DB=jobfinder_tour
TOUR_URL="${DEV_URL%/*}/$TOUR_DB"

WORK="$(mktemp -d)"
GROUPS_TO_STOP=()

# Stops both servers and drops the database whatever happened; keeps the logs of a failed run.
cleanup() {
  local status=$?
  for group in "${GROUPS_TO_STOP[@]}"; do kill -- "-$group" 2>/dev/null || true; done
  psql "$DEV_URL" -qc "DROP DATABASE IF EXISTS $TOUR_DB WITH (FORCE)" || true
  if [ "$status" -eq 0 ]; then rm -rf "$WORK"; else echo "Logs kept in $WORK" >&2; fi
}
trap cleanup EXIT

# Starts a command in its own process group, so cleanup stops it with all its children.
start() {
  setsid "$@" &
  GROUPS_TO_STOP+=($!)
}

# Waits for a URL to answer, failing after a minute and a half.
wait_for() {
  for _ in $(seq 90); do curl -sf -o /dev/null "$1" && return 0; sleep 1; done
  echo "No answer from $1" >&2
  exit 1
}

python3 -I -c 'from PIL import features; assert features.check("webp")' ||
  { echo 'Python 3 with Pillow (WebP support) is needed.' >&2; exit 1; }

# Replays the fictitious offers: each take stars and hides some.
seed() {
  psql "$TOUR_URL" -q -v ON_ERROR_STOP=1 -f "$TOUR/seed.sql"
}

echo '>> Database'
psql "$DEV_URL" -qc "DROP DATABASE IF EXISTS $TOUR_DB WITH (FORCE)" -c "CREATE DATABASE $TOUR_DB"
(cd "$ROOT/backend" && DATABASE_URL="$TOUR_URL" npx prisma migrate deploy >"$WORK/migrate.log")
(cd "$ROOT/backend" && printf '%s' "$PASSWORD" | DATABASE_URL="$TOUR_URL" npx tsx src/cli/set-password.ts - >/dev/null)

echo '>> API and app'
(cd "$ROOT/backend" && npx nest build >"$WORK/build.log")
# No crawl, no heartbeat, no sign-in throttle; a fake Jooble key so every source reads as set up.
start env -C "$ROOT/backend" DATABASE_URL="$TOUR_URL" PORT="$API_PORT" \
  INGESTION_ON_STARTUP=false INGESTION_CRON_ENABLED=false INGESTION_HEARTBEAT_URL= \
  LOGIN_THROTTLE_ENABLED=false JOOBLE_API_KEY=tour SEARCH_AREA_LABEL=Normandy \
  node dist/main >"$WORK/backend.log" 2>&1
printf '{ "/api": { "target": "http://localhost:%s", "secure": false } }\n' "$API_PORT" >"$WORK/proxy.json"
start env -C "$ROOT/frontend" npx ng serve --port "$APP_PORT" --proxy-config "$WORK/proxy.json" \
  >"$WORK/frontend.log" 2>&1
wait_for "http://localhost:$API_PORT/readyz"
wait_for "http://localhost:$APP_PORT/"

echo '>> Tour'
seed
node "$TOUR/record.mjs" "$WORK/record"
python3 -I "$TOUR/encode_tour.py" "$WORK/record" "$MEDIA/tour.webp"

echo '>> Screens'
seed
node "$TOUR/shots.mjs" "$WORK/shots"
python3 -I "$TOUR/frame_screens.py" "$WORK/shots" "$MEDIA"
