import { Injectable, Logger } from '@nestjs/common';
import { COMPANIES } from './companies.config.js';
import { ATS_FETCHERS } from './providers/ats-fetchers.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';

/**
 * One connector for every company career site polled through a public ATS API.
 */
@Injectable()
export class AtsSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  readonly name = 'ATS';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(AtsSource.name);

  /**
   * No credentials involved: enabled as long as the company list is not empty.
   */
  isEnabled(): boolean {
    return COMPANIES.length > 0;
  }

  /**

   * One company failing must not cost the others, so failures are logged and skipped.

   */
  async fetchJobs(): Promise<RawJob[]> {
    const results = await Promise.allSettled(
      COMPANIES.map((company) => ATS_FETCHERS[company.provider](company)),
    );

    const jobs: RawJob[] = [];
    results.forEach((result, index) => {
      const company = COMPANIES[index];
      if (result.status === 'fulfilled') {
        jobs.push(...result.value);
      } else {
        this.logger.warn(
          `${company.name} (${company.provider}) failed: ${result.reason}`,
        );
      }
    });

    return jobs;
  }
}
