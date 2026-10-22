import { describe, expect, it } from 'vitest';

import { stripNul } from './strip-nul.js';

/**
 * Cleaning of text bound for PostgreSQL.
 */
describe('stripNul', () => {
  it('removes every NUL character and keeps the rest', () => {
    expect(stripNul('Dév\u0000elop\u0000peur')).toBe('Développeur');
  });
});
