import type { JobModel } from '../generated/prisma/models.js';

/**
 * A stored offer as Prisma returns it, with overrides for the edge cases.
 */
export function jobRow(overrides: Partial<JobModel> = {}): JobModel {
  return {
    id: 'job-1',
    source: 'FRANCE_TRAVAIL',
    sourceId: '1',
    sourceLabel: 'France Travail',
    title: 'Développeur Angular H/F',
    company: 'Acme',
    companyDescription: 'Éditeur de logiciels',
    description: 'Stack Java et Spring, CDI',
    hasFullDescription: true,
    contractLabel: 'CDI',
    salary: null,
    city: 'Le Havre',
    postalCode: '76600',
    isRemote: false,
    isLocationApproximate: false,
    isViewed: false,
    isHidden: false,
    url: 'https://example.test/1',
    alternativeUrls: [],
    publishedAt: new Date('2026-10-20T08:00:00.000Z'),
    firstSeenAt: new Date('2026-10-20T09:00:00.000Z'),
    lastSeenAt: new Date('2026-10-21T09:00:00.000Z'),
    dedupeHash: 'hash',
    isFavorite: false,
    ...overrides,
  };
}
