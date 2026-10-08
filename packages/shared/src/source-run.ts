/**
 * One finished ingestion run of a source, as listed in the sources tab.
 */
export interface SourceRun {
  /**
   * Start of the run, ISO 8601.
   */
  startedAt: string;

  /**
   * End of the run, ISO 8601.
   */
  finishedAt: string;

  /**
   * Raw offers returned by the source.
   */
  fetched: number;

  /**
   * Offers that passed the filters.
   */
  kept: number;

  /**
   * Offers written for the first time.
   */
  inserted: number;

  /**
   * Offers already known from this source.
   */
  updated: number;

  /**
   * Failure message, null on success.
   */
  error: string | null;
}
