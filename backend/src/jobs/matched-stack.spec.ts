import { describe, expect, it } from 'vitest';

import { matchedStack } from './matched-stack.js';

/**
 * Stack keywords picked out of an offer for the feed and the detail.
 */
describe('matchedStack', () => {
  it('keeps the profile order and spelling', () => {
    expect(matchedStack('Java et Angular, sans accent', ['Angular', 'Java', 'PHP'])).toEqual([
      'Angular',
      'Java',
    ]);
  });

  it('respects word boundaries', () => {
    expect(matchedStack('JavaScript only', ['java', 'javascript'])).toEqual(['javascript']);
  });

  it('drops a keyword already covered by a longer match', () => {
    expect(
      matchedStack('API en Spring Boot et ASP.NET', ['spring', 'spring boot', '.net', 'asp.net']),
    ).toEqual(['spring boot', 'asp.net']);
  });

  it('returns nothing when no keyword appears', () => {
    expect(matchedStack('Commercial terrain', ['angular'])).toEqual([]);
  });
});
