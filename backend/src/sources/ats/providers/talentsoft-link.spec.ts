import { describe, expect, it } from 'vitest';

import { resolveLink } from './talentsoft-link.js';

/**
 * Resolution of an item link against the career site host.
 */
describe('resolveLink', () => {
  it('keeps an absolute link', () => {
    expect(resolveLink('https://jobs.test/offre?idOffre=1', 'careers.test')).toBe(
      'https://jobs.test/offre?idOffre=1',
    );
  });

  it('reads a relative link from the host', () => {
    expect(resolveLink('/Pages/Offre.aspx?idOffre=1', 'careers.test')).toBe(
      'https://careers.test/Pages/Offre.aspx?idOffre=1',
    );
  });

  it('answers null for a missing or malformed link', () => {
    expect(resolveLink(undefined, 'careers.test')).toBeNull();
    expect(resolveLink('http://', 'careers.test')).toBeNull();
  });
});
