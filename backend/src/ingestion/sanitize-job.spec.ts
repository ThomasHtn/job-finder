import { describe, expect, it } from 'vitest';

import { rawJob } from '../sources/raw-job.fixtures.js';
import { sanitizeJob } from './sanitize-job.js';

/**
 * Cleaning of the text fields of a raw offer.
 */
describe('sanitizeJob', () => {
  it('strips NUL characters from every text field and from the link lists', () => {
    const clean = sanitizeJob(
      rawJob({
        title: 'Déve\u0000loppeur',
        description: 'Stack\u0000 Java',
        company: 'Acme\u0000',
        alternativeUrls: ['https://partner.test/\u00001'],
      }),
    );

    expect(clean).toMatchObject({
      title: 'Développeur',
      description: 'Stack Java',
      company: 'Acme',
      alternativeUrls: ['https://partner.test/1'],
    });
  });

  it('leaves dates, numbers, booleans and nulls untouched', () => {
    const raw = rawJob({ publishedAt: new Date('2026-10-01T00:00:00Z'), latitude: 49.5 });

    expect(sanitizeJob(raw)).toEqual(raw);
  });
});
