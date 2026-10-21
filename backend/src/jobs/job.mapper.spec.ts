import { describe, expect, it } from 'vitest';

import { jobRow } from './job.fixtures.js';
import { toDetail, toSummary } from './job.mapper.js';

/**
 * Prisma row to the list and detail DTOs.
 */
describe('job mapper', () => {
  const stack = ['angular', 'java', 'spring'];

  it('renders dates as ISO strings and the stack from title and description', () => {
    const summary = toSummary(jobRow(), stack);

    expect(summary.publishedAt).toBe('2026-10-20T08:00:00.000Z');
    expect(summary.firstSeenAt).toBe('2026-10-20T09:00:00.000Z');
    expect(summary.stack).toEqual(['angular', 'java', 'spring']);
  });

  it('keeps a missing publication date and description as null and empty stack', () => {
    const summary = toSummary(
      jobRow({ publishedAt: null, description: null, title: 'Développeur' }),
      stack,
    );

    expect(summary.publishedAt).toBeNull();
    expect(summary.stack).toEqual([]);
  });

  it('leaves the internal columns out of the summary', () => {
    const summary = toSummary(jobRow(), stack);

    expect(summary).not.toHaveProperty('dedupeHash');
    expect(summary).not.toHaveProperty('description');
  });

  it('adds the full texts to the detail', () => {
    const detail = toDetail(jobRow(), stack);

    expect(detail.description).toBe('Stack Java et Spring, CDI');
    expect(detail.companyDescription).toBe('Éditeur de logiciels');
    expect(detail.id).toBe('job-1');
  });
});
