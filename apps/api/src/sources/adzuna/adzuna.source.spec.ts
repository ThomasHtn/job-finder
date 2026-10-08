import type { ConfigService } from '@nestjs/config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Env } from '../../config/env.schema.js';
import { PROFILE } from '../../ingestion/test-fixtures.js';
import { AdzunaSource } from './adzuna.source.js';

vi.mock('../../common/sleep.js', () => ({ sleep: async () => {} }));

/**
 * Config stub answering both credentials.
 */
const config = {
  get: () => 'key',
} as unknown as ConfigService<Env, true>;

/**
 * Successful search page holding the given ids.
 */
function page(...ids: string[]): Response {
  const results = ids.map((id) => ({
    id,
    title: `Développeur ${id}`,
    redirect_url: `https://adzuna.fr/${id}`,
  }));
  return new Response(JSON.stringify({ results }), { status: 200 });
}

/**
 * Adzuna's intermittent outage, an HTML page behind a 503.
 */
function outage(): Response {
  return new Response('<!DOCTYPE html><html>Uh oh</html>', { status: 503 });
}

/**
 * Specs of the Adzuna connector's resilience.
 */
describe('AdzunaSource', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries a transient 503 and keeps the results', async () => {
    fetchMock
      .mockResolvedValueOnce(outage())
      .mockResolvedValueOnce(page('a'))
      .mockResolvedValue(page());

    const jobs = await new AdzunaSource(config, PROFILE).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['a']);
  });

  it('keeps the other queries when one keeps failing', async () => {
    fetchMock
      .mockResolvedValueOnce(outage())
      .mockResolvedValueOnce(outage())
      .mockResolvedValueOnce(outage())
      .mockResolvedValue(page('b'));

    const jobs = await new AdzunaSource(config, PROFILE).fetchJobs();

    expect(jobs.map((job) => job.sourceId)).toEqual(['b']);
  });

  it('fails with a short message when every query fails', async () => {
    fetchMock.mockImplementation(async () => outage());

    await expect(new AdzunaSource(config, PROFILE).fetchJobs()).rejects.toThrow(
      'Adzuna search failed (503): HTML error page',
    );
  });

  it('does not retry a client error', async () => {
    fetchMock.mockImplementation(
      async () => new Response('{"exception":"AUTH_FAIL"}', { status: 401 }),
    );

    await expect(new AdzunaSource(config, PROFILE).fetchJobs()).rejects.toThrow(
      'Adzuna search failed (401): {"exception":"AUTH_FAIL"}',
    );
    /* One local query and two remote phrases, a single attempt each. */
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
