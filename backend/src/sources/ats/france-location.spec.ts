import { describe, expect, it } from 'vitest';

import { isFrance, mentionsForeignCountry } from './france-location.js';

/**
 * Country checks of the international ATS boards.
 */
describe('france location', () => {
  it('recognises France by name or code, among several candidates', () => {
    expect(isFrance('Paris, France')).toBe(true);
    expect(isFrance(undefined, ' FR ')).toBe(true);
    expect(isFrance('Berlin', null)).toBe(false);
    expect(isFrance('Francelandia')).toBe(false);
  });

  it('flags a foreign office unless France is named too', () => {
    expect(mentionsForeignCountry('Madrid, Spain')).toBe(true);
    expect(mentionsForeignCountry('Paris, France or Berlin, Germany')).toBe(false);
    expect(mentionsForeignCountry('Rouen')).toBe(false);
    expect(mentionsForeignCountry(null)).toBe(false);
  });
});
