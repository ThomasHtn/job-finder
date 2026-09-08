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
  FRANCE,
  FULL_REMOTE,
  MAX_PAGES,
  PAGE_SIZE,
  PERMANENT,
  SEARCH_URL,
  TIMEOUT_MS,
} from './free-work.constants.js';
import { toRawJob } from './free-work.mapper.js';
import type { FreeWorkJob } from './free-work.types.js';

/**
 * Free-Work connector: IT-only board, full ad text and coordinates included.
 */
@Injectable()
export class FreeWorkSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  readonly name = 'FREE_WORK';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(FreeWorkSource.name);

  /**
   * Place comes from the profile.
   */
  constructor(
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * Public endpoint, no credentials needed.
   */
  isEnabled(): boolean {
    return true;
  }

  /**
   * Everything permanent in the configured locations, plus a nationwide remote sweep.
   */
  async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<number, FreeWorkJob>();

    for (const job of await this.search({
      locationKeys: this.profile.area.freeWorkLocations.join(','),
    })) {
      jobs.set(job.id, job);
    }
    for (const job of await this.search({
      remoteMode: FULL_REMOTE,
      locationKeys: FRANCE,
    })) {
      jobs.set(job.id, job);
    }

    return [...jobs.values()].map(toRawJob);
  }

  /**
   * One search, paged until a short page or the cap.
   */
  private async search(
    criteria: Record<string, string>,
  ): Promise<FreeWorkJob[]> {
    const collected: FreeWorkJob[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);

      const params = new URLSearchParams({
        ...criteria,
        contracts: PERMANENT,
        itemsPerPage: String(PAGE_SIZE),
        page: String(page),
      });
      const response = await fetch(`${SEARCH_URL}?${params}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        /* Keep what was already collected rather than losing the whole source. */
        this.logger.warn(
          `Search ${JSON.stringify(criteria)} stopped at ${response.status}, keeping ${collected.length} offers`,
        );
        break;
      }

      const results = (await response.json()) as FreeWorkJob[];
      collected.push(...results);
      if (results.length < PAGE_SIZE) break;
    }

    return collected;
  }
}
