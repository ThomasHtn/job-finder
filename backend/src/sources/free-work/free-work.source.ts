import { Inject, Injectable, Logger } from '@nestjs/common';

import { SEARCH_PROFILE } from '../../shared/config/search-profile.token.js';
import type { SearchProfile } from '../../shared/config/search-profile.types.js';
import { collectPages } from '../collect-pages.js';
import { getJson } from '../get-json.js';
import type { JobSourceConnector } from '../job-source-connector.types.js';
import type { RawJob } from '../raw-job.js';
import { SearchTally } from '../search-tally.js';
import { sleep } from '../sleep.js';
import {
  DELAY_BETWEEN_REQUESTS_MS,
  FRANCE,
  FULL_REMOTE_MODE,
  MAX_PAGES,
  PAGE_SIZE,
  PERMANENT_CONTRACT,
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
  public readonly name = 'FREE_WORK';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(FreeWorkSource.name);

  /**
   * Place comes from the profile.
   */
  constructor(@Inject(SEARCH_PROFILE) private readonly profile: SearchProfile) {}

  /**
   * Public endpoint, no credentials needed.
   */
  public isEnabled(): boolean {
    return true;
  }

  /**
   * Everything permanent in the configured locations, plus a nationwide remote sweep.
   * A failing search is skipped; the source only fails when both did.
   */
  public async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<number, FreeWorkJob>();
    const tally = new SearchTally(this.logger);
    const searches: Record<string, string>[] = [
      { locationKeys: this.profile.area.freeWorkLocations.join(',') },
      { remoteMode: FULL_REMOTE_MODE, locationKeys: FRANCE },
    ];

    for (const criteria of searches) {
      for (const job of await tally.run(JSON.stringify(criteria), () => this.search(criteria))) {
        jobs.set(job.id, job);
      }
    }
    tally.throwIfAllFailed();

    return [...jobs.values()].map(toRawJob);
  }

  /**
   * One search, paged until a short page or the cap.
   */
  private search(criteria: Record<string, string>): Promise<FreeWorkJob[]> {
    return collectPages(
      {
        label: JSON.stringify(criteria),
        maxPages: MAX_PAGES,
        pageSize: PAGE_SIZE,
        logger: this.logger,
      },
      (index) => this.searchPage(criteria, index + 1),
    );
  }

  /**
   * One page of a search, one-based.
   */
  private async searchPage(criteria: Record<string, string>, page: number): Promise<FreeWorkJob[]> {
    await sleep(DELAY_BETWEEN_REQUESTS_MS);

    const params = new URLSearchParams({
      ...criteria,
      contracts: PERMANENT_CONTRACT,
      itemsPerPage: String(PAGE_SIZE),
      page: String(page),
    });
    const body = await getJson<unknown>(`${SEARCH_URL}?${params}`, {
      label: 'Free-Work search',
      timeoutMs: TIMEOUT_MS,
      headers: { Accept: 'application/json' },
    });
    if (!Array.isArray(body)) {
      throw new Error('Free-Work search answered something else than a list');
    }

    return body as FreeWorkJob[];
  }
}
