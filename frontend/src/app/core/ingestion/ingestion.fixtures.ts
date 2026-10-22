import type { IngestionSummary, JobSource } from '@job-finder/contract';

/**
 * A manual refresh that found `inserted` offers, with the given sources down.
 */
export function ingestionSummary(
  inserted: number,
  failedSources: JobSource[] = [],
): IngestionSummary {
  return {
    fetched: inserted,
    kept: inserted,
    inserted,
    updated: 0,
    merged: 0,
    purged: 0,
    skippedSources: [],
    failedSources,
  };
}
