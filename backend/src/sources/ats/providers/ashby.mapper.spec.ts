import { describe, expect, it } from 'vitest';

import type { CompanyConfig } from '../ats.types.js';
import { toRawJob } from './ashby.mapper.js';

/**
 * Company mapped by the specs below.
 */
const COMPANY: CompanyConfig = { name: 'Acme', provider: 'ashby', board: 'acme' };

/**
 * Specs of the Ashby posting mapping.
 */
describe('Ashby toRawJob', () => {
  it('reads the structured address', () => {
    const job = toRawJob(COMPANY, {
      id: 'a',
      title: 'Développeur',
      jobUrl: 'https://jobs.ashbyhq.com/acme/a',
      location: 'Caen',
      descriptionPlain: 'Stack Java',
      employmentType: 'FullTime',
      address: {
        postalAddress: { addressCountry: 'France', addressLocality: 'Caen', postalCode: '14000' },
      },
    });

    expect(job).toMatchObject({
      sourceId: 'ashby:acme:a',
      sourceLabel: 'Acme (Ashby)',
      city: 'Caen',
      postalCode: '14000',
      hasFullDescription: true,
      isPermanent: true,
      isRemote: false,
    });
  });

  it('falls back to the location text, flags remote work and ignores a bad date', () => {
    const job = toRawJob(COMPANY, {
      id: 'c',
      title: 'Développeur',
      jobUrl: 'https://jobs.ashbyhq.com/acme/c',
      location: 'France',
      workplaceType: 'Remote',
      publishedAt: 'not a date',
    });

    expect(job).toMatchObject({ city: 'France', isRemote: true, publishedAt: null });
  });
});
