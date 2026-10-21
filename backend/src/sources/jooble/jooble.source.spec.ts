import type { ConfigService } from '@nestjs/config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Env } from '../../shared/config/env.schema.js';
import { PROFILE } from '../../shared/config/search-profile.fixtures.js';
import type { SearchProfile } from '../../shared/config/search-profile.js';
import { MAX_KEYWORDS } from './jooble.constants.js';
import { JoobleSource } from './jooble.source.js';
import type { JoobleJob } from './jooble.types.js';

vi.mock('../sleep.js', () => ({ sleep: async () => {} }));

/**
 * Address a fetch was called with.
 */
function href(input: Parameters<typeof fetch>[0]): string {
  return input instanceof Request ? input.url : input.toString();
}

/**
 * Config stub answering the given key.
 */
function config(key: string | undefined): ConfigService<Env, true> {
  return { get: () => key } as unknown as ConfigService<Env, true>;
}

/**
 * Profile with more keywords than the connector queries.
 */
const MANY_KEYWORDS: SearchProfile = {
  ...PROFILE,
  keywords: ['développeur', 'developer', 'full stack', 'ingénieur logiciel'],
};

/**
 * Offer whose link carries the id and a query-specific tracking parameter.
 */
function offer(id: string, query: string): JoobleJob {
  return {
    title: `Développeur <b>${id}</b>`,
    link: `https://fr.jooble.org/jdp/${id}?ckey=${encodeURIComponent(query)}`,
    snippet: 'Stack Java',
    type: 'CDI',
    source: 'Indeed',
    updated: '2026-10-07T00:00:00Z',
  };
}

/**
 * Numeric offer id standing for each keyword of MANY_KEYWORDS.
 */
const ID_BY_QUERY: Record<string, string> = {
  développeur: '10',
  developer: '20',
  'full stack': '30',
  'ingénieur logiciel': '40',
};

/**
 * Keywords of a search request.
 */
function keywords(init?: RequestInit): string {
  return (JSON.parse(init?.body as string) as { keywords: string }).keywords;
}

/**
 * Specs of the Jooble connector: key, mapping, dedupe and resilience.
 */
describe('JoobleSource', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is skipped without a key', () => {
    expect(new JoobleSource(config(undefined), PROFILE).isEnabled()).toBe(false);
    expect(new JoobleSource(config('key'), PROFILE).isEnabled()).toBe(true);
  });

  it('queries the leading keywords only, deduplicating offers by id across them', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const query = keywords(init);
      return new Response(
        JSON.stringify({ jobs: [offer('1', query), offer(ID_BY_QUERY[query], query)] }),
      );
    });

    const jobs = await new JoobleSource(config('key'), MANY_KEYWORDS).fetchJobs();

    expect(fetchMock).toHaveBeenCalledTimes(MAX_KEYWORDS);
    expect(href(fetchMock.mock.calls[0][0])).toBe('https://jooble.org/api/key');
    expect(jobs.filter((job) => job.sourceId === '1')).toHaveLength(1);
    expect(jobs).toHaveLength(MAX_KEYWORDS + 1);
    expect(jobs[0]).toMatchObject({
      source: 'JOOBLE',
      sourceLabel: 'Jooble (Indeed)',
      title: 'Développeur 1',
      isPermanent: true,
      hasFullDescription: false,
    });
  });

  it('keeps the other queries when one fails', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const query = keywords(init);
      return query === 'développeur'
        ? new Response('<html>challenge</html>', { status: 403 })
        : new Response(JSON.stringify({ jobs: [offer(ID_BY_QUERY[query], query)] }));
    });

    const jobs = await new JoobleSource(config('key'), MANY_KEYWORDS).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['20', '30']);
  });

  it('fails when every query fails', async () => {
    fetchMock.mockImplementation(async () => new Response('', { status: 403 }));

    await expect(new JoobleSource(config('key'), PROFILE).fetchJobs()).rejects.toThrow(
      'Jooble search failed (403)',
    );
  });
});
