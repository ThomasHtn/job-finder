import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROFILE } from '../../shared/config/search-profile.fixtures.js';
import type { SearchProfile } from '../../shared/config/search-profile.types.js';
import { DIRECT_HIRE, RESULTS_PER_PAGE } from './eures.constants.js';
import { EuresSource } from './eures.source.js';
import type { EuresJob } from './eures.types.js';

vi.mock('../sleep.js', () => ({ sleep: async () => {} }));

/**
 * Profile searching two keywords, so dedupe and per-query failures show.
 */
const TWO_KEYWORDS: SearchProfile = { ...PROFILE, keywords: ['développeur', 'developer'] };

/**
 * Vacancies numbered from the prefix, as many as asked.
 */
function vacancies(prefix: string, count: number): EuresJob[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}${index}`,
    title: `Développeur ${prefix}${index}`,
    description: '<p>Stack Java</p>',
    positionOfferingCode: DIRECT_HIRE,
    creationDate: Date.UTC(2026, 9, 20),
    employer: { name: 'Acme' },
  }));
}

/**
 * Search page answering the given vacancies.
 */
function page(results: EuresJob[]): Response {
  return new Response(JSON.stringify({ jvs: results }), { status: 200 });
}

/**
 * Keyword and page number of a search request.
 */
function request(init?: RequestInit): { keyword: string; page: number } {
  const body = JSON.parse(init?.body as string) as {
    page: number;
    keywords: { keyword: string }[];
  };
  return { keyword: body.keywords[0].keyword, page: body.page };
}

/**
 * Specs of the EURES connector: mapping, paging and resilience.
 */
describe('EuresSource', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the vacancies, deduplicated across keywords', async () => {
    fetchMock.mockImplementation(async (_url, init) =>
      request(init).keyword === 'développeur'
        ? page(vacancies('a', 2))
        : page([...vacancies('a', 1), ...vacancies('b', 1)]),
    );

    const jobs = await new EuresSource(TWO_KEYWORDS).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['a0', 'a1', 'b0']);
    expect(jobs[0]).toMatchObject({
      source: 'EURES',
      description: 'Stack Java',
      city: PROFILE.area.label,
      isPermanent: true,
      publishedAt: new Date('2026-10-20T00:00:00.000Z'),
    });
  });

  it('asks one-based pages within the configured regions', async () => {
    fetchMock.mockImplementation(async (_url, init) =>
      request(init).page === 1 ? page(vacancies('p1-', RESULTS_PER_PAGE)) : page([]),
    );

    await new EuresSource(PROFILE).fetchJobs();

    const pages = fetchMock.mock.calls.map(([, init]) => request(init).page);
    expect(pages).toEqual([1, 2]);
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
      locationCodes: string[];
    };
    expect(body.locationCodes).toEqual(PROFILE.area.euresRegions);
  });

  it.each([
    ['an error status', async () => new Response('', { status: 503 })],
    [
      'a network failure',
      async () => {
        throw new TypeError('fetch failed');
      },
    ],
  ])('keeps the pages read when a later one fails with %s', async (_label, failure) => {
    fetchMock.mockImplementation(async (_url, init) =>
      request(init).page === 1 ? page(vacancies('p1-', RESULTS_PER_PAGE)) : failure(),
    );

    await expect(new EuresSource(PROFILE).fetchJobs()).resolves.toHaveLength(RESULTS_PER_PAGE);
  });

  it('keeps the other keywords when one fails', async () => {
    fetchMock.mockImplementation(async (_url, init) =>
      request(init).keyword === 'développeur'
        ? new Response('', { status: 500 })
        : page(vacancies('b', 1)),
    );

    const jobs = await new EuresSource(TWO_KEYWORDS).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['b0']);
  });

  it('fails when every keyword fails', async () => {
    fetchMock.mockImplementation(async () => new Response('', { status: 500 }));

    await expect(new EuresSource(TWO_KEYWORDS).fetchJobs()).rejects.toThrow(
      'EURES search failed (500)',
    );
  });
});
