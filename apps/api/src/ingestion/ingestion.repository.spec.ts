import { describe, expect, it } from 'vitest';
import { planMerge } from './ingestion.repository.js';
import { rawJob } from './test-fixtures.js';

/**
 * Existing offer without a full description.
 */
const twin = {
  id: 't',
  url: 'https://twin.test',
  hasFullDescription: false,
  alternativeUrls: [] as string[],
};

/**
 * Merge decision when the same offer comes back from another source.
 */
describe('planMerge', () => {
  it('only records the new link when the twin already has the richer text', () => {
    const job = { ...rawJob({ hasFullDescription: false }), dedupeHash: 'h' };
    expect(planMerge({ ...twin, hasFullDescription: true }, job)).toEqual({
      alternativeUrls: ['https://example.test/1'],
    });
  });

  it('promotes the fuller description and demotes the old link', () => {
    const job = { ...rawJob({ description: 'Long text' }), dedupeHash: 'h' };
    expect(planMerge(twin, job)).toEqual({
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
    );
    expect(plan.alternativeUrls).not.toContain('https://twin.test');
  });
});
