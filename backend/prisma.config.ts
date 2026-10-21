import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// The backend's own .env, like the app itself (cp .env.example .env).
config({ path: '.env', quiet: true });

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
