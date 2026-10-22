import { describe, expect, it } from 'vitest';

import type { CompanyConfig } from '../ats.types.js';
import { toRawJob } from './smartrecruiters.mapper.js';

/**
 * Company mapped by the specs below.
 */
const COMPANY: CompanyConfig = { name: 'Acme', provider: 'smartrecruiters', board: 'acme' };

/**
 * Specs of the SmartRecruiters posting mapping.
 */
describe('SmartRecruiters toRawJob', () => {
  it('maps the posting and builds the ad url', () => {
    const job = toRawJob(
      COMPANY,
      {
        id: 'p1',
        name: 'Développeur',
        releasedDate: '2026-10-01T00:00:00Z',
        location: { city: 'Le Havre', country: 'fr', postalCode: '76600' },
        typeOfEmployment: { id: 'permanent', label: 'CDI' },
      },
      'Acme\n\nStack Java',
    );

    expect(job).toMatchObject({
      sourceId: 'smartrecruiters:acme:p1',
      description: 'Acme\n\nStack Java',
      hasFullDescription: true,
      isPermanent: true,
      city: 'Le Havre',
      url: 'https://jobs.smartrecruiters.com/acme/p1',
      publishedAt: new Date('2026-10-01T00:00:00Z'),
    });
  });

  it('keeps the offer when the description is missing', () => {
    const job = toRawJob(COMPANY, { id: 'p2', name: 'Developer' }, null);

    expect(job).toMatchObject({ description: null, hasFullDescription: false, isPermanent: null });
  });
});
