import { describe, expect, it } from 'vitest';

import type { CompanyConfig } from '../ats.types.js';
import { toRawJob } from './lever.mapper.js';

/**
 * Company mapped by the specs below.
 */
const COMPANY: CompanyConfig = { name: 'Acme', provider: 'lever', board: 'acme' };

/**
 * Specs of the Lever posting mapping.
 */
describe('Lever toRawJob', () => {
  it('joins the plain texts and reads the commitment and the epoch date', () => {
    const job = toRawJob(COMPANY, {
      id: 'a',
      text: 'Développeur',
      hostedUrl: 'https://jobs.lever.co/acme/a',
      descriptionPlain: 'Stack Angular',
      additionalPlain: 'Mutuelle',
      workplaceType: 'remote',
      createdAt: Date.UTC(2026, 9, 1),
      categories: { location: 'Paris', commitment: 'CDI' },
    });

    expect(job).toMatchObject({
      sourceId: 'lever:acme:a',
      description: 'Stack Angular\n\nMutuelle',
      hasFullDescription: true,
      isPermanent: true,
      isRemote: true,
      city: 'Paris',
      publishedAt: new Date('2026-10-01T00:00:00Z'),
    });
  });

  it('leaves what the posting does not say empty', () => {
    const job = toRawJob(COMPANY, { id: 'b', text: 'Développeur', hostedUrl: 'https://x.test/b' });

    expect(job).toMatchObject({ description: null, isPermanent: null, publishedAt: null });
  });
});
