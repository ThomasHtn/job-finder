import type { JobCounts } from './job-counts.js';
import type { JobSummary } from './job-summary.js';

/**
 * Payload of the list endpoint.
 */
export interface JobListResponse {
  /**
   * Offers of the requested tab, newest first.
   */
  jobs: JobSummary[];

  /**
   * Counts for every tab, so the segmented control stays in sync.
   */
  counts: JobCounts;

  /**
   * End of the last successful ingestion, ISO 8601.
   */
  lastIngestionAt: string | null;
}
