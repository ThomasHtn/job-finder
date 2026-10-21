import type { JobSummary } from './job-summary.js';

/**
 * Full offer, returned by the detail endpoint.
 */
export interface JobDetail extends JobSummary {
  /**
   * Plain-text description, when the source exposes one.
   */
  description: string | null;

  /**
   * Plain-text presentation of the company, when the source exposes one.
   */
  companyDescription: string | null;
}
