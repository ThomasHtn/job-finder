import { afterEach, describe, expect, it, vi } from 'vitest';

import { getJson } from './get-json.js';

/**
 * Specs of the JSON GET shared by the ATS providers.
 */
describe('getJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the parsed body and sets a timeout', async () => {
    const fetchMock = vi.fn(async () => new Response('{"jobs":[]}'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getJson('https://ats.test/jobs', 1000)).resolves.toEqual({ jobs: [] });
    expect(fetchMock).toHaveBeenCalledWith('https://ats.test/jobs', {
      signal: expect.any(AbortSignal),
    });
  });

  it('fails on a non-2xx status, naming the url', async () => {
    vi.stubGlobal('fetch', async () => new Response('nope', { status: 404 }));

    await expect(getJson('https://ats.test/jobs', 1000)).rejects.toThrow(
      'https://ats.test/jobs returned 404',
    );
  });
});
