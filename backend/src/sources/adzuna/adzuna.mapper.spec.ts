import { describe, expect, it } from 'vitest';

import { toRawJob } from './adzuna.mapper.js';

/**
 * Mapping of an Adzuna result.
 */
describe('toRawJob (Adzuna)', () => {
  it('takes the most precise area as the town and names a permanent contract CDI', () => {
    const job = toRawJob(
      {
        id: '5001',
        title: 'Développeur .NET',
        redirect_url: 'https://www.adzuna.fr/land/ad/5001',
        contract_type: 'permanent',
        location: { display_name: 'Évreux, Eure', area: ['France', 'Normandie', 'Eure', 'Évreux'] },
      },
      false,
    );

    expect(job).toMatchObject({
      city: 'Évreux',
      contractLabel: 'CDI',
      isPermanent: true,
      hasFullDescription: false,
      isRemote: false,
    });
  });

  it('keeps an unknown contract as is and takes the remote sweep', () => {
    const job = toRawJob(
      { id: '1', title: 'Dev', redirect_url: 'https://x.example', contract_type: 'contract' },
      true,
    );

    expect(job).toMatchObject({ contractLabel: 'contract', isPermanent: false, isRemote: true });
  });
});
