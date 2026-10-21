import { describe, expect, it } from 'vitest';

import { toRawJob } from './jooble.mapper.js';

/**
 * Mapping of a Jooble result.
 */
describe('toRawJob (Jooble)', () => {
  it('takes the id from the link and strips the snippet markup', () => {
    const job = toRawJob({
      title: 'Développeur <b>Angular</b> H/F',
      location: 'Rouen, Seine-Maritime',
      snippet: '&nbsp;...Stack <b>Angular</b> et Java...',
      type: 'CDI',
      link: 'https://jooble.org/jdp/-2828851657177295530',
      company: 'Acme',
      source: 'hellowork.com',
      updated: '2026-10-07T00:00:00.0000000',
    });

    expect(job).toMatchObject({
      sourceId: '-2828851657177295530',
      sourceLabel: 'Jooble (hellowork.com)',
      title: 'Développeur Angular H/F',
      description: '...Stack Angular et Java...',
      isPermanent: true,
      hasFullDescription: false,
      locationText: 'Rouen, Seine-Maritime',
    });
  });
});
