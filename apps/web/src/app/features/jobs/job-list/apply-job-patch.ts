import type { JobListResponse, JobSummary } from '@job-finder/shared';

/**
 * Replaces one row of the list in place and moves the favourites count with it.
 * Returns the list untouched when the offer is not in it.
 */
export function applyJobPatch(
  current: JobListResponse | null,
  patched: JobSummary,
): JobListResponse | null {
  const previous = current?.jobs.find((job) => job.id === patched.id);
  if (!current || !previous) return current;

  const favorites =
    current.counts.favorites + (patched.isFavorite ? 1 : 0) - (previous.isFavorite ? 1 : 0);

  return {
    ...current,
    jobs: current.jobs.map((job) => (job.id === patched.id ? patched : job)),
    counts: { ...current.counts, favorites },
  };
}
