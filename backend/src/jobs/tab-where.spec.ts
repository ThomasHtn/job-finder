import { describe, expect, it } from 'vitest';

import { tabWhere } from './tab-where.js';

/**
 * Prisma filter of each tab.
 */
describe('tabWhere', () => {
  it.each([
    ['local', { isRemote: false, isHidden: false }],
    ['remote', { isRemote: true, isHidden: false }],
    ['favorites', { isFavorite: true, isHidden: false }],
  ] as const)('selects the visible offers of %s', (tab, where) => {
    expect(tabWhere(tab)).toEqual(where);
  });
});
