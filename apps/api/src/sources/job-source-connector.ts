import type { RawJob } from './raw-job.js';

/**
 * Contract every source implements.
 */
export interface JobSourceConnector {
  /**
   * Stable identifier used in logs and in the IngestionRun table.
   */
  readonly name: string;

  /**
   * False when credentials are missing: the source is skipped, not failed.
   */
  isEnabled(): boolean;

  /**
   * Every offer the source returns for the profile, unfiltered.
   */
  fetchJobs(): Promise<RawJob[]>;
}
