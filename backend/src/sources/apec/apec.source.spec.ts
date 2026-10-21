import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROFILE } from '../../shared/config/search-profile.fixtures.js';
import { PAGE_SIZE } from './apec.constants.js';
import { ApecSource } from './apec.source.js';
import type { ApecOffer } from './apec.types.js';

vi.mock('../sleep.js', () => ({ sleep: async () => {} }));

/**
 * Offers numbered from the prefix, as many as asked.
 */
function offers(prefix: string, count: number): ApecOffer[] {
  return Array.from({ length: count }, (_, index) => ({
    numeroOffre: `${prefix}${index}`,
    intitule: `Développeur ${prefix}${index}`,
    lieuTexte: 'Rouen - 76',
  }));
}

/**
 * Search page answering the given offers.
 */
function page(results: ApecOffer[]): Response {
  return new Response(JSON.stringify({ resultats: results }), { status: 200 });
}

/**
 * Body of a search request, to tell the local pass from the remote one and read the page.
 */
function criteria(init?: RequestInit): {
  lieux?: string[];
  typesTeletravail?: string[];
  pagination: { startIndex: number };
} {
  return JSON.parse(init?.body as string);
}

/**
 * Specs of the APEC connector: mapping, remote flag, paging and resilience.
 */
describe('ApecSource', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the offers and flags those the remote pass found, once each', async () => {
    fetchMock.mockImplementation(async (_url, init) =>
      criteria(init).lieux
        ? page([...offers('local', 1), ...offers('both', 1)])
        : page(offers('both', 1)),
    );

    const jobs = await new ApecSource(PROFILE).fetchJobs();

    expect(jobs.map((job) => [job.sourceId, job.isRemote])).toEqual([
      ['local0', false],
      ['both0', true],
    ]);
    expect(jobs[0]).toMatchObject({
      source: 'APEC',
      city: 'Rouen',
      isPermanent: true,
      hasFullDescription: false,
      url: expect.stringContaining('/local0'),
    });
    const local = criteria(fetchMock.mock.calls[0][1]);
    expect(local.lieux).toEqual([PROFILE.area.apecLocation]);
  });

  it('pages a full result until a short page', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const body = criteria(init);
      if (!body.lieux) return page([]);
      return body.pagination.startIndex === 0
        ? page(offers('p0-', PAGE_SIZE))
        : page(offers('p1-', 1));
    });

    const jobs = await new ApecSource(PROFILE).fetchJobs();

    expect(jobs).toHaveLength(PAGE_SIZE + 1);
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
    fetchMock.mockImplementation(async (_url, init) => {
      const body = criteria(init);
      if (!body.lieux) return page([]);
      return body.pagination.startIndex === 0 ? page(offers('p0-', PAGE_SIZE)) : failure();
    });

    await expect(new ApecSource(PROFILE).fetchJobs()).resolves.toHaveLength(PAGE_SIZE);
  });

  it('keeps the other search when one fails on its first page', async () => {
    fetchMock.mockImplementation(async (_url, init) =>
      criteria(init).lieux ? new Response('', { status: 500 }) : page(offers('remote', 2)),
    );

    const jobs = await new ApecSource(PROFILE).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['remote0', 'remote1']);
  });

  it('fails when every search fails', async () => {
    fetchMock.mockImplementation(async () => new Response('', { status: 500 }));

    await expect(new ApecSource(PROFILE).fetchJobs()).rejects.toThrow('APEC search failed (500)');
  });
});
