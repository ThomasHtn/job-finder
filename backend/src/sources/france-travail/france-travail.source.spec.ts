import type { ConfigService } from '@nestjs/config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Env } from '../../shared/config/env.schema.js';
import { PROFILE } from '../../shared/config/search-profile.fixtures.js';
import { sleep } from '../sleep.js';
import { MAX_RETRIES, PAGE_SIZE, RETRY_BACKOFF_MS, TOKEN_URL } from './france-travail.constants.js';
import { FranceTravailSource } from './france-travail.source.js';
import type { FranceTravailOffer } from './france-travail.types.js';

vi.mock('../sleep.js', () => ({ sleep: vi.fn(async () => {}) }));

/**
 * Address a fetch was called with.
 */
function href(input: Parameters<typeof fetch>[0]): string {
  return input instanceof Request ? input.url : input.toString();
}

/**
 * Config stub answering both OAuth credentials, or none.
 */
function config(withKeys = true): ConfigService<Env, true> {
  return { get: () => (withKeys ? 'secret' : undefined) } as unknown as ConfigService<Env, true>;
}

/**
 * Offers numbered from the prefix, as many as asked.
 */
function offers(prefix: string, count: number): FranceTravailOffer[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}${index}`,
    intitule: `Développeur ${prefix}${index}`,
    typeContrat: 'CDI',
    lieuTravail: { libelle: '76 - LE HAVRE', codePostal: '76600' },
  }));
}

/**
 * Search page answering the given offers; 206 when it is a partial range.
 */
function page(results: FranceTravailOffer[]): Response {
  return new Response(JSON.stringify({ resultats: results }), {
    status: results.length < PAGE_SIZE ? 206 : 200,
  });
}

/**
 * OAuth token answer.
 */
function token(): Response {
  return new Response(JSON.stringify({ access_token: 'bearer', expires_in: 1499 }));
}

/**
 * Query string of a search request.
 */
function params(url: string | URL | Request): URLSearchParams {
  return new URL(href(url)).searchParams;
}

/**
 * True for a search of the local pass, the one bound to the configured town.
 */
function isLocal(url: string | URL | Request): boolean {
  return params(url).has('commune');
}

/**
 * Specs of the France Travail connector: token, retries, paging and resilience.
 */
describe('FranceTravailSource', () => {
  const fetchMock = vi.fn<typeof fetch>();

  /**
   * Routes the token request to a token and every search to the given handler.
   */
  function route(search: (url: string | URL | Request) => Promise<Response>): void {
    fetchMock.mockImplementation(async (url) => (href(url) === TOKEN_URL ? token() : search(url)));
  }

  /**
   * Search calls only, without the token request.
   */
  function searchCalls() {
    return fetchMock.mock.calls.filter(([url]) => href(url) !== TOKEN_URL);
  }

  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(sleep).mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is skipped without its credentials', () => {
    expect(new FranceTravailSource(config(false), PROFILE).isEnabled()).toBe(false);
    expect(new FranceTravailSource(config(), PROFILE).isEnabled()).toBe(true);
  });

  it('maps the offers of the local and remote passes, deduplicated, with one token', async () => {
    route(async (url) =>
      isLocal(url) ? page(offers('a', 2)) : page([...offers('a', 1), ...offers('r', 1)]),
    );

    const jobs = await new FranceTravailSource(config(), PROFILE).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['a0', 'a1', 'r0']);
    expect(jobs[0]).toMatchObject({
      source: 'FRANCE_TRAVAIL',
      city: 'Le Havre',
      isPermanent: true,
    });
    expect(fetchMock.mock.calls.filter(([url]) => href(url) === TOKEN_URL)).toHaveLength(1);
    const [local, remote] = searchCalls().map(([url]) => params(url));
    expect(local.get('commune')).toBe(PROFILE.area.insee);
    expect(local.get('distance')).toBe(String(PROFILE.area.driveKm));
    expect(local.get('range')).toBe(`0-${PAGE_SIZE - 1}`);
    expect(remote.get('motsCles')).toBe('développeur télétravail');
    expect(searchCalls()[0][1]?.headers).toEqual({ Authorization: 'Bearer bearer' });
  });

  it('reads a 204 as no result', async () => {
    route(async () => new Response(null, { status: 204 }));

    await expect(new FranceTravailSource(config(), PROFILE).fetchJobs()).resolves.toEqual([]);
  });

  it('waits as long as Retry-After says on a 429, then retries', async () => {
    let limited = false;
    route(async (url) => {
      if (isLocal(url) && !limited) {
        limited = true;
        return new Response('', { status: 429, headers: { 'Retry-After': '2' } });
      }
      return page(isLocal(url) ? offers('a', 1) : []);
    });

    const jobs = await new FranceTravailSource(config(), PROFILE).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['a0']);
    expect(vi.mocked(sleep)).toHaveBeenCalledWith(2000);
  });

  it('falls back to the default backoff and gives up after the last retry', async () => {
    route(async (url) => (isLocal(url) ? new Response('', { status: 429 }) : page(offers('r', 1))));

    const jobs = await new FranceTravailSource(config(), PROFILE).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['r0']);
    expect(searchCalls().filter(([url]) => isLocal(url))).toHaveLength(MAX_RETRIES + 1);
    expect(vi.mocked(sleep)).toHaveBeenCalledWith(RETRY_BACKOFF_MS);
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
    route(async (url) => {
      if (!isLocal(url)) return page([]);
      return params(url).get('range')?.startsWith('0-')
        ? page(offers('p0-', PAGE_SIZE))
        : failure();
    });

    await expect(new FranceTravailSource(config(), PROFILE).fetchJobs()).resolves.toHaveLength(
      PAGE_SIZE,
    );
  });

  it('fails when the token is refused', async () => {
    fetchMock.mockImplementation(async () => new Response('invalid_client', { status: 401 }));

    await expect(new FranceTravailSource(config(), PROFILE).fetchJobs()).rejects.toThrow(
      'France Travail auth failed (401)',
    );
  });

  it('fails when every search fails', async () => {
    route(async () => new Response('', { status: 500 }));

    await expect(new FranceTravailSource(config(), PROFILE).fetchJobs()).rejects.toThrow(
      'France Travail search failed (500)',
    );
  });
});
