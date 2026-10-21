import type { JobDetail, JobListResponse, JobSummary } from '@job-finder/contract';

/**
 * A feed row with sensible defaults, published and first seen now.
 */
export function jobSummary(overrides: Partial<JobSummary> = {}): JobSummary {
  return {
    id: 'job-1',
    title: 'Développeur Angular',
    company: 'Acme',
    city: 'Le Havre',
    postalCode: '76600',
    isRemote: false,
    isLocationApproximate: false,
    sourceLabel: 'France Travail',
    url: 'https://example.test/offer',
    hasFullDescription: true,
    contractLabel: 'CDI',
    salary: null,
    stack: ['Angular'],
    isFavorite: false,
    isViewed: false,
    publishedAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    alternativeUrls: [],
    ...overrides,
  };
}

/**
 * A full offer around the feed row defaults.
 */
export function jobDetail(overrides: Partial<JobDetail> = {}): JobDetail {
  return {
    ...jobSummary(),
    description: 'Vos missions :\n- Concevoir les écrans',
    companyDescription: null,
    ...overrides,
  };
}

/**
 * A list payload around the given rows.
 */
export function jobList(jobs: JobSummary[]): JobListResponse {
  return {
    jobs,
    counts: { local: jobs.length, remote: 0, favorites: 0 },
    lastIngestionAt: '2026-09-03T10:00:00.000Z',
  };
}
