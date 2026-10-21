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
import { DAY_MS, HOUR_MS, SECOND_MS } from '../shared/helpers/time.constants.js';

/**
 * The password the README and the browser tests sign in with.
 */
const DEMO_PASSWORD = 'job-finder-demo-password';

/**
 * Obviously fictitious offers covering every state a screen shows: on-site, approximate, remote,
 * starred, truncated.
 */
const OFFERS = [
  {
    source: 'FRANCE_TRAVAIL',
    sourceLabel: 'France Travail',
    title: 'Développeur Angular / Java H/F',
    company: 'Démo Logistique Portuaire',
    city: 'Le Havre',
    postalCode: '76600',
    salary: '42 000 - 48 000 EUR par an',
    description:
      'Au sein de la DSI, vous faites évoluer le suivi des conteneurs : Angular, Spring Boot, PostgreSQL.',
    hasFullDescription: true,
    daysAgo: 0,
  },
  {
    source: 'ATS',
    sourceLabel: 'Démo Énergies (Greenhouse)',
    title: 'Ingénieur logiciel TypeScript',
    company: 'Démo Énergies',
    city: 'Rouen',
    postalCode: '76000',
    isFavorite: true,
    description: 'Vous concevez les outils de pilotage des éoliennes en mer : NestJS et Angular.',
    hasFullDescription: true,
    daysAgo: 1,
  },
  {
    source: 'EURES',
    sourceLabel: 'EURES',
    title: 'Développeur full stack',
    company: 'Démo Industries',
    city: 'Haute-Normandie',
    postalCode: null,
    isLocationApproximate: true,
    description: 'Poste en Haute-Normandie, ville précisée à l’entretien. Vue.js, Node.js.',
    hasFullDescription: true,
    daysAgo: 3,
  },
  {
    source: 'APEC',
    sourceLabel: 'APEC',
    title: 'Tech lead Java H/F',
    company: 'Démo Assurances Normandes',
    city: 'Caen',
    postalCode: '14000',
    description: 'Vous encadrez une équipe de cinq développeurs. Java 21, Spring, Kafka...',
    hasFullDescription: false,
    daysAgo: 5,
  },
  {
    source: 'ATS',
    sourceLabel: 'Démo Santé (Lever)',
    title: 'Senior software engineer (full remote)',
    company: 'Démo Santé',
    city: null,
    postalCode: null,
    isRemote: true,
    description: 'Fully remote across France: TypeScript, React and Node.js.',
    hasFullDescription: true,
    daysAgo: 2,
  },
] as const;

/**
 * Past runs of boards that need no credentials, so the sources tab shows a healthy and a failing one.
 */
const RUNS = [
  { source: 'ATS', error: null },
  { source: 'EURES', error: null },
  { source: 'FREE_WORK', error: 'Free-Work search failed (502): demo outage' },
] as const;

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
  const hash = hashPassword(DEMO_PASSWORD);
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
        dedupeHash: computeDedupeHash(offer.title, offer.company, offer.city),
      })),
    });
    await prisma.ingestionRun.createMany({
      data: RUNS.map(({ source, error }) => ({
        source,
        startedAt: new Date(now - 2 * HOUR_MS),
        finishedAt: new Date(now - 2 * HOUR_MS + 30 * SECOND_MS),
        fetched: error ? 0 : 40,
        kept: error ? 0 : 3,
        inserted: error ? 0 : 3,
        error,
      })),
    });
    console.log(`Demo ready: ${OFFERS.length} offers, password "${DEMO_PASSWORD}".`);
  }
} finally {
  await prisma.$disconnect();
}
