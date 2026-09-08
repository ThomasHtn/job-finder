/**
 * What happened to one prepared offer when it was written.
 */
export type PersistOutcome = 'inserted' | 'updated' | 'merged';

/**
 * Figures recorded on a finished IngestionRun.
 */
export interface RunCounters {
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
}

/**
 * Outcome of the last completed run of one source.
 */
export interface FinishedRun {
  /**
   * When the run ended.
   */
  finishedAt: Date | null;

  /**
   * Failure message, null on success.
   */
  error: string | null;
}

/**
 * The columns of an existing offer that a merge reads.
 */
export interface Twin {
  /**
   * Database identifier of the twin.
   */
  id: string;

  /**
   * Current main link of the twin.
   */
  url: string;

  /**
   * Whether the twin already holds a full description.
   */
  hasFullDescription: boolean;

  /**
   * Links already collected from other sources.
   */
  alternativeUrls: string[];
}
