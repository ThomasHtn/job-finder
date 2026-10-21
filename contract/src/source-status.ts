import type { JobSource } from './job-source.js';
import type { SourceRun } from './source-run.js';

/**
 * Health of one source's last completed run, so the UI can flag a partial list.
 */
export interface SourceStatus {
  /**
   * Source identifier.
   */
  source: JobSource;

  /**
   * False when the source has no credentials configured: it never runs.
   */
  enabled: boolean;

  /**
   * End of the last completed run, ISO 8601.
   */
  lastRunAt: string | null;

  /**
   * True when enabled and the last run succeeded.
   */
  ok: boolean;

  /**
   * Error message of the last run, when it failed.
   */
  error: string | null;

  /**
   * End of the last successful run, ISO 8601, which may be older than the last run.
   */
  lastSuccessAt: string | null;

  /**
   * Visible offers currently stored under this source.
   */
  jobCount: number;

  /**
   * Latest finished runs, newest first.
   */
  runs: SourceRun[];
}
