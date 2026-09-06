import { Injectable, Logger } from '@nestjs/common';
import { COMPANIES } from './companies.config.js';
import { ATS_FETCHERS } from './providers.js';
import type { JobSourceConnector, RawJob } from '../source.types.js';

@Injectable()
export class AtsSource implements JobSourceConnector {
  readonly name = 'ATS';
  private readonly logger = new Logger(AtsSource.name);

  isEnabled(): boolean {
    return COMPANIES.length > 0;
  }

  /** One company failing must not cost the others, so failures are logged and skipped. */
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
