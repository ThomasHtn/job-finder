import type { SourceRun } from '@job-finder/shared';
import type { FinishedRun } from './ingestion.types.js';

/**
 * Database run to its API shape; only called on runs filtered on completion.
 */
export function toSourceRun(run: FinishedRun): SourceRun {
  return {
    startedAt: run.startedAt.toISOString(),
    finishedAt: (run.finishedAt ?? run.startedAt).toISOString(),
    fetched: run.fetched,
    kept: run.kept,
    inserted: run.inserted,
    updated: run.updated,
    error: run.error,
  };
}
