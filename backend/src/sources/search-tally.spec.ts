import type { Logger } from '@nestjs/common';

import { describe, expect, it, vi } from 'vitest';

import { SearchTally } from './search-tally.js';

/**
 * Tally on a logger that records its warnings.
 */
function tally() {
  const logger = { warn: vi.fn() };
  return { tally: new SearchTally(logger as unknown as Logger), logger };
}

/**
 * The rule every source follows: a failing search is skipped, all of them failing fails the source.
 */
describe('SearchTally', () => {
  it('answers an empty list for a failing search and warns about it', async () => {
    const { tally: searches, logger } = tally();
    expect(await searches.run('"java"', () => Promise.reject(new Error('503')))).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith('Search "java" skipped: 503');
  });

  it('keeps the source up as long as one search answered', async () => {
    const { tally: searches } = tally();
    await searches.run('a', () => Promise.reject(new Error('503')));
    expect(await searches.run('b', () => Promise.resolve([1]))).toEqual([1]);
    expect(() => searches.throwIfAllFailed()).not.toThrow();
  });

  it('fails with the first error when every search failed', async () => {
    const { tally: searches } = tally();
    await searches.run('a', () => Promise.reject(new Error('first')));
    await searches.run('b', () => Promise.reject(new Error('second')));
    expect(() => searches.throwIfAllFailed()).toThrow('first');
  });

  it('never fails a source that ran no search at all', () => {
    expect(() => tally().tally.throwIfAllFailed()).not.toThrow();
  });
});
