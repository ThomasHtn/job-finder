import { describe, expect, it } from 'vitest';

import { tabWhere } from './tab-where.js';

/**
 * Prisma filter of each tab.
 */
describe('tabWhere', () => {
  it.each([
    ['local', { isRemote: false }],
    ['remote', { isRemote: true }],
    ['favorites', { isFavorite: true }],
  ] as const)('selects the offers of %s', (tab, where) => {
    expect(tabWhere(tab)).toEqual(where);
  });
});
