import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { jobDetail, jobSummary } from './job.fixtures';
import { detailPlaceLabel, isNewSince, rowPlaceLabel } from './job.utils';

describe('job utils', () => {
  useFrenchTexts();

  it('writes the feed place like France Travail', () => {
    expect(rowPlaceLabel(jobSummary())).toBe('76 - Le Havre');
    expect(rowPlaceLabel(jobSummary({ postalCode: null }))).toBe('Le Havre');
    expect(rowPlaceLabel(jobSummary({ city: null }))).toBe('Lieu non précisé');
    expect(rowPlaceLabel(jobSummary({ isRemote: true }))).toBe('Full remote');
  });

  it('spells the place out in the panel and flags a region-only one', () => {
    expect(detailPlaceLabel(jobDetail())).toBe('Le Havre (76600)');
    expect(detailPlaceLabel(jobDetail({ postalCode: null }))).toBe('Le Havre');
    expect(detailPlaceLabel(jobDetail({ city: null }))).toBe('Lieu non précisé');
    expect(detailPlaceLabel(jobDetail({ isRemote: true }))).toBe('Full remote');
    expect(
      detailPlaceLabel(jobDetail({ city: 'Seine-Maritime', isLocationApproximate: true })),
    ).toBe('Seine-Maritime (commune non précisée)');
  });

  it('flags only the offers first seen after the previous visit', () => {
    const job = jobSummary({ firstSeenAt: '2026-09-06T10:00:00.000Z' });
    expect(isNewSince(job, '2026-09-05T00:00:00.000Z')).toBe(true);
    expect(isNewSince(job, '2026-09-07T00:00:00.000Z')).toBe(false);
    expect(isNewSince(job, null)).toBe(false);
  });
});
