import { describe, expect, it } from 'vitest';

import { rawJob } from '../sources/raw-job.fixtures.js';
import { planMerge } from './plan-merge.js';

/**
 * Existing offer without a full description.
 */
const twin = {
  id: 't',
  url: 'https://twin.test',
  sourceLabel: 'APEC',
  publishedAt: null as Date | null,
  hasFullDescription: false,
  alternativeUrls: [] as string[],
};

/**
 * Merge decision when the same offer comes back from another source.
 */
describe('planMerge', () => {
  it('only records the new link when the twin already has the richer text', () => {
    const job = { ...rawJob({ hasFullDescription: false }), dedupeHash: 'h' };
    expect(planMerge({ ...twin, hasFullDescription: true }, job, 'merge')).toEqual({
      alternativeUrls: ['https://example.test/1'],
    });
  });

  it('promotes the fuller description and demotes the old link', () => {
    const job = { ...rawJob({ description: 'Long text' }), dedupeHash: 'h' };
    expect(planMerge(twin, job, 'merge')).toEqual({
      alternativeUrls: ['https://twin.test'],
      url: 'https://example.test/1',
      description: 'Long text',
      hasFullDescription: true,
      sourceLabel: 'France Travail',
    });
  });

  it('never lists the main url among the alternatives', () => {
    const job = { ...rawJob({ hasFullDescription: false }), dedupeHash: 'h' };
    const plan = planMerge(
      { ...twin, hasFullDescription: true, alternativeUrls: ['https://twin.test'] },
      job,
      'merge',
    );
    expect(plan.alternativeUrls).not.toContain('https://twin.test');
  });

  it('keeps the partner links the incoming offer carries', () => {
    const job = {
      ...rawJob({ hasFullDescription: false, alternativeUrls: ['https://partner.test/1'] }),
      dedupeHash: 'h',
    };
    expect(planMerge({ ...twin, hasFullDescription: true }, job, 'merge').alternativeUrls).toEqual([
      'https://partner.test/1',
      'https://example.test/1',
    ]);
  });

  it('refreshes the publication date to the newest of both, never to nothing', () => {
    const older = new Date('2026-10-01T00:00:00Z');
    const newer = new Date('2026-10-05T00:00:00Z');
    const job = (publishedAt: Date | null) => ({ ...rawJob({ publishedAt }), dedupeHash: 'h' });

    expect(planMerge({ ...twin, publishedAt: older }, job(newer), 'merge').publishedAt).toBe(newer);
    expect(planMerge({ ...twin, publishedAt: null }, job(older), 'merge').publishedAt).toBe(older);
    expect(
      planMerge({ ...twin, publishedAt: newer }, job(older), 'merge').publishedAt,
    ).toBeUndefined();
    expect(
      planMerge({ ...twin, publishedAt: newer }, job(null), 'refresh').publishedAt,
    ).toBeUndefined();
  });

  it('lets an offer seen again refresh its own row on a tie, but not a twin', () => {
    const job = { ...rawJob({ url: 'https://new.test' }), dedupeHash: 'h' };
    const both = { ...twin, hasFullDescription: true, sourceLabel: 'France Travail' };

    expect(planMerge(both, job, 'refresh')).toMatchObject({ url: 'https://new.test' });
    expect(planMerge(both, job, 'merge')).not.toHaveProperty('url');
  });

  it('drops the old link of its own board, but keeps the one of another board', () => {
    const job = { ...rawJob({ url: 'https://new.test' }), dedupeHash: 'h' };
    const own = { ...twin, url: 'https://old.test', hasFullDescription: true };

    expect(
      planMerge({ ...own, sourceLabel: 'France Travail' }, job, 'refresh').alternativeUrls,
    ).toEqual([]);
    expect(planMerge({ ...own, sourceLabel: 'APEC' }, job, 'refresh').alternativeUrls).toEqual([
      'https://old.test',
    ]);
  });
});
