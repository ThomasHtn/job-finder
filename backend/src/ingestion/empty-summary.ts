import type { IngestionSummary } from '@job-finder/contract';

/**
 * Fresh summary, every counter at zero.
 */
export function emptySummary(): IngestionSummary {
  return {
    fetched: 0,
    kept: 0,
    inserted: 0,
    updated: 0,
    merged: 0,
    purged: 0,
    skippedSources: [],
    failedSources: [],
  };
}
