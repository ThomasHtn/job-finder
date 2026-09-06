#!/usr/bin/env bash
# Creates the app role and database on the local PostgreSQL server (no Docker).
# Idempotent. Uses sudo to reach the "postgres" superuser through peer auth.
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env ] || { echo "Missing .env, run: cp .env.example .env" >&2; exit 1; }

# .env is not sourced: unquoted values with spaces (INGESTION_CRON) would break bash.
env_value() { sed -n "s/^$1=//p" .env | tail -n 1; }
DB_USER="$(env_value POSTGRES_USER)"
DB_PASSWORD="$(env_value POSTGRES_PASSWORD)"
DB_NAME="$(env_value POSTGRES_DB)"
: "${DB_USER:?POSTGRES_USER missing in .env}" "${DB_PASSWORD:?POSTGRES_PASSWORD missing in .env}" "${DB_NAME:?POSTGRES_DB missing in .env}"

PSQL=(sudo -u postgres psql -X -q -v ON_ERROR_STOP=1)

# CREATEDB is required by `prisma migrate dev`, which spins up a shadow database.
"${PSQL[@]}" <<SQL
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    ALTER ROLE "${DB_USER}" WITH LOGIN CREATEDB PASSWORD '${DB_PASSWORD}';
  ELSE
    CREATE ROLE "${DB_USER}" WITH LOGIN CREATEDB PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL

# CREATE DATABASE cannot run inside a DO block, so the existence check is separate.
if [ "$("${PSQL[@]}" -At -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'")" != "1" ]; then
  "${PSQL[@]}" -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\""
fi

echo "Database \"${DB_NAME}\" ready for role \"${DB_USER}\" on the local PostgreSQL server."
