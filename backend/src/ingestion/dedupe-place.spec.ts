import { describe, expect, it } from 'vitest';

import { dedupePlace } from './dedupe-place.js';

/**
 * Place used by the similarity key.
 */
describe('dedupePlace', () => {
  it('gives every remote offer the same place', () => {
    expect(dedupePlace(true, 'Rouen')).toBe(dedupePlace(true, null));
  });

  it('keeps the city of an on-site offer', () => {
    expect(dedupePlace(false, 'Rouen')).toBe('Rouen');
    expect(dedupePlace(false, null)).toBeNull();
  });
});
