import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchOk } from './fetch-ok.js';
import { getJson } from './get-json.js';
import { getText } from './get-text.js';
import { postForm } from './post-form.js';
import { postJson } from './post-json.js';

/**
 * Options shared by the cases below.
 */
const OPTIONS = { label: 'Board search', timeoutMs: 1000 };

/**
 * Specs of the request helpers shared by every board.
 */
describe('request helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs the parsed body with a timeout and the given headers', async () => {
    const fetchMock = vi.fn(async () => new Response('{"jobs":[]}'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      getJson('https://board.test/jobs', { ...OPTIONS, headers: { Accept: 'application/json' } }),
    ).resolves.toEqual({ jobs: [] });
    expect(fetchMock).toHaveBeenCalledWith('https://board.test/jobs', {
      headers: { Accept: 'application/json' },
      signal: expect.any(AbortSignal),
    });
  });

  it('GETs a body as text', async () => {
    vi.stubGlobal('fetch', async () => new Response('<rss/>'));

    await expect(getText('https://board.test/feed', OPTIONS)).resolves.toBe('<rss/>');
  });

  it('POSTs a JSON body', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(postJson('https://board.test/search', { page: 1 }, OPTIONS)).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://board.test/search',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"page":1}',
      }),
    );
  });

  it('POSTs a form body', async () => {
    const fetchMock = vi.fn(async () => new Response('{"token":"t"}'));
    vi.stubGlobal('fetch', fetchMock);
    const form = new URLSearchParams({ grant_type: 'client_credentials' });

    await expect(postForm('https://board.test/token', form, OPTIONS)).resolves.toEqual({
      token: 't',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://board.test/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      }),
    );
  });

  it('fails on a non-2xx status without leaking the url or the body', async () => {
    vi.stubGlobal('fetch', async () => new Response('secret page', { status: 404 }));

    const failure = fetchOk('https://board.test/jobs?app_key=SECRET', {}, OPTIONS);

    await expect(failure).rejects.toThrow(/^Board search failed \(404\)$/);
  });
});
