import { describe, expect, it } from 'vitest';

import { DIRECT_HIRE } from './eures.constants.js';
import { toRawJob } from './eures.mapper.js';

/**
 * Mapping of a EURES vacancy.
 */
describe('toRawJob (EURES)', () => {
  it('stands the area label in for the town and flags the location as approximate', () => {
    const job = toRawJob(
      { id: 'abc', title: 'Développeur', positionOfferingCode: DIRECT_HIRE },
      'Normandie',
    );

    expect(job).toMatchObject({
      city: 'Normandie',
      locationText: null,
      isLocationApproximate: true,
      contractLabel: 'Embauche directe',
      isPermanent: true,
    });
  });

  it('never calls a fixed-term direct hire permanent', () => {
    const job = toRawJob(
      { id: 'abc', title: 'Développeur en CDD', positionOfferingCode: DIRECT_HIRE },
      'Normandie',
    );

    expect(job.isPermanent).toBe(false);
  });

  it('is not permanent without a direct hire', () => {
    expect(toRawJob({ id: 'abc', title: 'Développeur' }, 'Normandie').isPermanent).toBe(false);
  });
});
