import type { JobListResponse, JobSummary } from '@job-finder/shared';

import { applyJobPatch } from './apply-job-patch';

/**
 * A minimal row: only the fields the patch reads matter here.
 */
function row(id: string, isFavorite: boolean): JobSummary {
  return { id, isFavorite, title: id } as JobSummary;
}

/**
 * A list holding the given rows, with one favourite already counted.
 */
function list(...jobs: JobSummary[]): JobListResponse {
  return {
    jobs,
    counts: { local: jobs.length, remote: 0, favorites: 1 },
    lastIngestionAt: null,
  };
}

/**
 * In-place update of one row coming back from the detail panel.
 */
describe('applyJobPatch', () => {
  it('replaces the row and keeps the others in order', () => {
    const patched = { ...row('b', false), title: 'renamed' };

    const result = applyJobPatch(list(row('a', false), row('b', false)), patched);

    expect(result?.jobs.map((job) => job.title)).toEqual(['a', 'renamed']);
  });

  it('moves the favourites count when the star changes', () => {
    const starred = applyJobPatch(list(row('a', false)), row('a', true));
    const unstarred = applyJobPatch(list(row('a', true)), row('a', false));

    expect(starred?.counts.favorites).toBe(2);
    expect(unstarred?.counts.favorites).toBe(0);
  });

  it('leaves the list untouched when the offer is not in it', () => {
    const current = list(row('a', false));

    expect(applyJobPatch(current, row('z', true))).toBe(current);
    expect(applyJobPatch(null, row('z', true))).toBeNull();
  });
});
