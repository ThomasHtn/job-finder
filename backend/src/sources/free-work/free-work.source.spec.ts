import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROFILE } from '../../shared/config/search-profile.fixtures.js';
import { FULL_REMOTE, PAGE_SIZE } from './free-work.constants.js';
import { FreeWorkSource } from './free-work.source.js';
import type { FreeWorkJob } from './free-work.types.js';

vi.mock('../sleep.js', () => ({ sleep: async () => {} }));

/**
 * Address a fetch was called with.
 */
function href(input: Parameters<typeof fetch>[0]): string {
  return input instanceof Request ? input.url : input.toString();
}

/**
 * Postings numbered from the start id, as many as asked.
 */
function postings(start: number, count: number): FreeWorkJob[] {
  return Array.from({ length: count }, (_, index) => ({
    id: start + index,
    title: `Développeur ${start + index}`,
    slug: `developpeur-${start + index}`,
    description: '<p>Stack Angular</p>',
    contracts: ['permanent'],
    location: { locality: 'Rouen', postalCode: '76000', latitude: '49.44', longitude: '1.09' },
  }));
}

/**
 * Search page answering the given postings.
 */
function page(results: FreeWorkJob[]): Response {
  return new Response(JSON.stringify(results), { status: 200 });
}

/**
 * Query string of a search request.
 */
function params(url: string | URL | Request): URLSearchParams {
  return new URL(href(url)).searchParams;
}

/**
 * True for the nationwide remote sweep.
 */
function isRemoteSearch(url: string | URL | Request): boolean {
  return params(url).get('remoteMode') === FULL_REMOTE;
}

/**
 * Specs of the Free-Work connector: mapping, paging and resilience.
 */
describe('FreeWorkSource', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the postings, deduplicated between the local and remote searches', async () => {
    fetchMock.mockImplementation(async (url) =>
      isRemoteSearch(url) ? page(postings(2, 2)) : page(postings(1, 2)),
    );

    const jobs = await new FreeWorkSource(PROFILE).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['1', '2', '3']);
    expect(jobs[0]).toMatchObject({
      source: 'FREE_WORK',
      city: 'Rouen',
      latitude: 49.44,
      isPermanent: true,
      description: 'Stack Angular',
    });
    const local = params(fetchMock.mock.calls[0][0]);
    expect(local.get('locationKeys')).toBe(PROFILE.area.freeWorkLocations.join(','));
    expect(local.get('contracts')).toBe('permanent');
    expect(local.get('page')).toBe('1');
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
    fetchMock.mockImplementation(async (url) => {
      if (isRemoteSearch(url)) return page([]);
      return params(url).get('page') === '1' ? page(postings(1, PAGE_SIZE)) : failure();
    });

    await expect(new FreeWorkSource(PROFILE).fetchJobs()).resolves.toHaveLength(PAGE_SIZE);
  });

  it('keeps the other search when one fails', async () => {
    fetchMock.mockImplementation(async (url) =>
      isRemoteSearch(url) ? page(postings(9, 1)) : new Response('', { status: 500 }),
    );

    const jobs = await new FreeWorkSource(PROFILE).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['9']);
  });

  it('fails when both searches fail', async () => {
    fetchMock.mockImplementation(async () => new Response('', { status: 500 }));

    await expect(new FreeWorkSource(PROFILE).fetchJobs()).rejects.toThrow(
      'Free-Work search failed (500)',
    );
  });
});
