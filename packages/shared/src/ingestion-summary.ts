/**
 * Result of one ingestion run, returned by the manual trigger endpoint.
 */
export interface IngestionSummary {
  /**
   * Raw offers returned by every source.
   */
  fetched: number;

  /**
   * Offers that passed the filters.
   */
  kept: number;

  /**
   * Offers seen for the first time.
   */
  inserted: number;

  /**
   * Offers already known from the same source.
   */
  updated: number;

  /**
   * Offers merged into a twin from another source.
   */
  merged: number;

  /**
   * Stale offers deleted at the end of the run.
   */
  purged: number;

  /**
   * Sources without credentials, never called.
   */
  skippedSources: string[];

  /**
   * Sources whose fetch failed during this run.
   */
  failedSources: string[];
}
