import { Inject, Injectable, Logger } from '@nestjs/common';
import { sleep } from '../../common/sleep.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../../config/search-profile.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import {
  DELAY_BETWEEN_REQUESTS_MS,
  MAX_PAGES,
  RESULTS_PER_PAGE,
  SEARCH_URL,
  TIMEOUT_MS,
} from './eures.constants.js';
import { toRawJob } from './eures.mapper.js';
import type { EuresJob } from './eures.types.js';

/**
 * EURES connector: region-level offers with no exact location.
 */
@Injectable()
export class EuresSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  readonly name = 'EURES';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(EuresSource.name);

  /**
   * Keywords and region come from the profile.
   */
  constructor(
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * Always enabled.
   */
  isEnabled(): boolean {
    /* Public API, no credentials needed. */
    return true;
  }

  /**
   * One search per keyword, deduplicated by id.
   */
  async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<string, EuresJob>();

    for (const query of this.profile.keywords) {
      for (const job of await this.search(query)) {
        jobs.set(job.id, job);
      }
    }

    return [...jobs.values()].map((job) =>
      toRawJob(job, this.profile.area.label),
    );
  }

  /**
   * Paged POST search for one keyword within the configured region.
   */
  private async search(keyword: string): Promise<EuresJob[]> {
    const collected: EuresJob[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);

      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultsPerPage: RESULTS_PER_PAGE,
          page,
          sortSearch: 'MOST_RECENT',
          keywords: [{ keyword, specificSearchCode: 'EVERYWHERE' }],
          publicationPeriod: null,
          occupationUris: [],
          skillUris: [],
          requiredExperienceCodes: [],
          positionScheduleCodes: [],
          sectorCodes: [],
          educationAndQualificationLevelCodes: [],
          positionOfferingCodes: [],
          /* EURES only locates offers at region level: the commute filter is skipped. */
          locationCodes: this.profile.area.euresRegions,
          euresFlagCodes: [],
          otherBenefitsCodes: [],
          requiredLanguages: [],
          minNumberPost: null,
          sessionId: 'job-finder',
          requestLanguage: 'fr',
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(`Search "${keyword}" stopped at ${response.status}`);
        break;
      }

      const body = (await response.json()) as { jvs?: EuresJob[] };
      const results = body.jvs ?? [];
      collected.push(...results);
      if (results.length < RESULTS_PER_PAGE) break;
    }

    return collected;
  }
}
