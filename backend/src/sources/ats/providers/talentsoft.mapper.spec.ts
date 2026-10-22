import { describe, expect, it } from 'vitest';

import type { CompanyConfig } from '../ats.types.js';
import { toRawJob } from './talentsoft.mapper.js';

/**
 * Company mapped by the specs below.
 */
const COMPANY: CompanyConfig = {
  name: 'Matmut',
  provider: 'talentsoft',
  board: 'recrutement.matmut.fr',
};

/**
 * Specs of the Talentsoft item mapping.
 */
describe('Talentsoft toRawJob', () => {
  it('strips the title reference and reads the contract and the address', () => {
    const job = toRawJob(
      COMPANY,
      {
        title: '2026-10639 - Ingénieur DevOps F/H',
        description: 'Stack Java',
        pubDate: 'Wed, 30 Sep 2026 15:04:39 Z',
        category: ["SYSTEMES D'INFORMATION", 'DUREE INDETERMINEE', '66 rue de Sotteville '],
      },
      'https://recrutement.matmut.fr/Pages/Offre/detailoffre.aspx?idOffre=10639',
    );

    expect(job).toMatchObject({
      sourceId: 'talentsoft:recrutement.matmut.fr:10639',
      sourceLabel: 'Matmut (Talentsoft)',
      title: 'Ingénieur DevOps F/H',
      isPermanent: true,
      locationText: '66 rue de Sotteville',
      publishedAt: new Date('2026-09-30T15:04:39Z'),
    });
  });
});
