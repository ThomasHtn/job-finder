import { Logger } from '@nestjs/common';

import { describe, expect, it, vi } from 'vitest';

import { collectPages, type PagedSearch } from './collect-pages.js';

/**
 * Search of two-item pages, at most three of them.
 */
const SEARCH: PagedSearch = {
  label: '"java"',
  maxPages: 3,
  pageSize: 2,
  logger: new Logger('spec'),
};

/**
 * Paging rules shared by the boards.
 */
describe('collectPages', () => {
  it('stops at the first short page', async () => {
    const fetchPage = vi.fn(async (index: number) => (index === 0 ? ['a', 'b'] : ['c']));

    await expect(collectPages(SEARCH, fetchPage)).resolves.toEqual(['a', 'b', 'c']);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('stops at the page cap', async () => {
    const fetchPage = vi.fn(async (_index: number) => ['a', 'b']);

    await expect(collectPages(SEARCH, fetchPage)).resolves.toHaveLength(6);
    expect(fetchPage.mock.calls.map(([index]) => index)).toEqual([0, 1, 2]);
  });

  it('fails when the first page fails', async () => {
    await expect(
      collectPages(SEARCH, async () => {
        throw new Error('APEC search failed (503)');
      }),
    ).rejects.toThrow('APEC search failed (503)');
  });

  it('keeps the pages already read when a later one fails, network errors included', async () => {
    const fetchPage = vi.fn(async (index: number) => {
      if (index === 0) return ['a', 'b'];
      throw new TypeError('fetch failed');
    });

    await expect(collectPages(SEARCH, fetchPage)).resolves.toEqual(['a', 'b']);
  });
});
