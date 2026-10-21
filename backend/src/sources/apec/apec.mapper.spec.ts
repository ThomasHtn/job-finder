import { describe, expect, it } from 'vitest';

import { DETAIL_URL } from './apec.constants.js';
import { toRawJob } from './apec.mapper.js';

/**
 * Mapping of an APEC offer.
 */
describe('toRawJob (APEC)', () => {
  it('keeps the town, drops the department and reads the coordinates when located', () => {
    const job = toRawJob(
      {
        numeroOffre: '178923W',
        intitule: 'Tech lead Java H/F',
        lieuTexte: 'Caen - 14',
        localisable: true,
        latitude: '49.18',
        longitude: '-0.37',
        datePublication: '2026-10-01T08:00:00.000+0000',
      },
      false,
    );

    expect(job).toMatchObject({
      sourceId: '178923W',
      city: 'Caen',
      postalCode: null,
      latitude: 49.18,
      longitude: -0.37,
      isPermanent: true,
      hasFullDescription: false,
      url: `${DETAIL_URL}/178923W`,
    });
    expect(job.publishedAt).toBeInstanceOf(Date);
  });

  it('ignores the coordinates of an offer APEC does not locate, and takes the remote facet', () => {
    const job = toRawJob(
      { numeroOffre: '1', intitule: 'Dev', localisable: false, latitude: '1', longitude: '2' },
      true,
    );

    expect(job).toMatchObject({ latitude: null, longitude: null, isRemote: true });
  });
});
