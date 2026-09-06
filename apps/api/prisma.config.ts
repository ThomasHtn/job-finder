import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Single .env at the repo root, shared with docker compose.
config({ path: '../../.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // process.env instead of env() so `prisma generate` works without a database.
    url: process.env.DATABASE_URL ?? '',
  },
});
