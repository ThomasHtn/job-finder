import { describe, expect, it } from 'vitest';

import {
  DEFAULT_JOB_SLUG,
  DETAIL_URL,
  FULL_REMOTE_MODE,
  PERMANENT_CONTRACT,
} from './free-work.constants.js';
import { toRawJob } from './free-work.mapper.js';

/**
 * Mapping of a Free-Work offer.
 */
describe('toRawJob (Free-Work)', () => {
  it('reads a located permanent offer', () => {
    const job = toRawJob({
      id: 42,
      title: 'Développeur Symfony',
      slug: 'developpeur-symfony',
      contracts: [PERMANENT_CONTRACT],
      job: { slug: 'developpeur' },
      location: { locality: 'Dieppe', postalCode: '76200', latitude: '49.92', longitude: '1.08' },
    });

    expect(job).toMatchObject({
      sourceId: '42',
      isPermanent: true,
      city: 'Dieppe',
      latitude: 49.92,
      isLocationApproximate: false,
      url: `${DETAIL_URL}/developpeur/developpeur-symfony`,
    });
  });

  it('flags a region-wide offer as approximate and falls back on the coarser level', () => {
    const job = toRawJob({
      id: 1,
      title: 'Dev',
      slug: 'dev',
      remoteMode: FULL_REMOTE_MODE,
      location: { adminLevel1: 'Normandie' },
    });

    expect(job).toMatchObject({
      city: 'Normandie',
      isLocationApproximate: true,
      isRemote: true,
      url: `${DETAIL_URL}/${DEFAULT_JOB_SLUG}/dev`,
    });
  });
});
