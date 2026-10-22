/**
 * Prepares a database for the demo of the root compose.yaml and the browser tests.
 *   npm run db:seed-demo                   development
 *   node dist/cli/seed-demo.js --demo      inside the image (NODE_ENV=production)
 * Idempotent: sets the demo password, then adds the offers and runs only to an empty database.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import { hashPassword } from '../auth/password-hash.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { computeDedupeHash } from '../ingestion/dedupe.js';
import { dedupePlace } from '../ingestion/dedupe-place.js';
import { DAY_MS } from '../shared/helpers/time.constants.js';
import {
  DEMO_FETCHED,
  DEMO_KEPT,
  DEMO_PASSWORD,
  DEMO_RUN_AGE_MS,
  DEMO_RUN_DURATION_MS,
  OFFERS,
  RUNS,
} from './seed-demo.constants.js';

/* Read before the guard, so a .env aimed at production is refused too. */
config({ path: '.env', quiet: true });

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--demo')) {
  console.error('Refusing to seed a production database: pass --demo if this one is a demo.');
  process.exit(1);
}

/**
 * Closed once the demo is written.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

try {
  const hash = await hashPassword(DEMO_PASSWORD);
  await prisma.appPassword.upsert({ where: { id: 1 }, create: { id: 1, hash }, update: { hash } });

  if ((await prisma.job.count()) > 0) {
    console.log('Demo password set; offers already present, left untouched.');
  } else {
    const now = Date.now();
    await prisma.job.createMany({
      data: OFFERS.map(({ daysAgo, ...offer }, index) => ({
        ...offer,
        sourceId: `demo-${index + 1}`,
        url: `https://jobs.example/demo-${index + 1}`,
        contractLabel: 'CDI',
        publishedAt: new Date(now - daysAgo * DAY_MS),
        dedupeHash: computeDedupeHash(
          offer.title,
          offer.company,
          dedupePlace('isRemote' in offer && offer.isRemote, offer.city),
        ),
      })),
    });
    await prisma.ingestionRun.createMany({
      data: RUNS.map(({ source, error }) => ({
        source,
        startedAt: new Date(now - DEMO_RUN_AGE_MS),
        finishedAt: new Date(now - DEMO_RUN_AGE_MS + DEMO_RUN_DURATION_MS),
        fetched: error ? 0 : DEMO_FETCHED,
        kept: error ? 0 : DEMO_KEPT,
        inserted: error ? 0 : DEMO_KEPT,
        error,
      })),
    });
    console.log(`Demo ready: ${OFFERS.length} offers, password "${DEMO_PASSWORD}".`);
  }
} finally {
  await prisma.$disconnect();
}
