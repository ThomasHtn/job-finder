import type { IngestionSummary } from '@job-finder/shared';

/**
 * Fresh summary, optionally pre-filled with skipped sources.
 */
export function emptySummary(skipped: string[] = []): IngestionSummary {
  return {
    fetched: 0,
    kept: 0,
    inserted: 0,
    updated: 0,
    merged: 0,
    purged: 0,
    skippedSources: skipped,
    failedSources: [],
  };
}
