import { HOUR_MS, SECOND_MS } from '../shared/helpers/time.constants.js';

/**
 * The password the README and the browser tests sign in with.
 */
export const DEMO_PASSWORD = 'job-finder-demo-password';

/**
 * Obviously fictitious offers covering every state a screen shows: on-site, approximate, remote,
 * starred, truncated.
 */
export const OFFERS = [
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
export const RUNS = [
  { source: 'ATS', error: null },
  { source: 'EURES', error: null },
  { source: 'FREE_WORK', error: 'Free-Work search failed (502): demo outage' },
] as const;

/**
 * How long ago the demo runs started.
 */
export const DEMO_RUN_AGE_MS = 2 * HOUR_MS;

/**
 * How long the demo runs lasted.
 */
export const DEMO_RUN_DURATION_MS = 30 * SECOND_MS;

/**
 * Offers fetched by a healthy demo run.
 */
export const DEMO_FETCHED = 40;

/**
 * Offers kept (and inserted) by a healthy demo run.
 */
export const DEMO_KEPT = 3;
