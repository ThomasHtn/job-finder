import { Inject, Injectable, Logger } from '@nestjs/common';

import { SEARCH_PROFILE, type SearchProfile } from '../../shared/config/search-profile.js';
import { collectPages } from '../collect-pages.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import { SearchTally } from '../search-tally.js';
import { sleep } from '../sleep.js';
import {
  DELAY_BETWEEN_REQUESTS_MS,
  MAX_PAGES,
  RESULTS_PER_PAGE,
  SEARCH_URL,
  TIMEOUT_MS,
} from './eures.constants.js';
import { toRawJob } from './eures.mapper.js';
import type { EuresJob, EuresSearchResponse } from './eures.types.js';

/**
 * EURES connector: region-level offers with no exact location.
 */
@Injectable()
export class EuresSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  public readonly name = 'EURES';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(EuresSource.name);

  /**
   * Keywords and region come from the profile.
   */
  constructor(@Inject(SEARCH_PROFILE) private readonly profile: SearchProfile) {}

  /**
   * Public API, no credentials needed.
   */
  public isEnabled(): boolean {
    return true;
  }

  /**
   * One search per keyword, deduplicated by id.
   * A failing search is skipped; the source only fails when every search did.
   */
  public async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<string, EuresJob>();
    const tally = new SearchTally(this.logger);

    for (const query of this.profile.keywords) {
      for (const job of await tally.run(`"${query}"`, () => this.search(query))) {
        jobs.set(job.id, job);
      }
    }
    tally.throwIfAllFailed();

    return [...jobs.values()].map((job) => toRawJob(job, this.profile.area.label));
  }

  /**
   * Paged POST search for one keyword within the configured region.
   */
  private search(keyword: string): Promise<EuresJob[]> {
    return collectPages(
      {
        label: `"${keyword}"`,
        maxPages: MAX_PAGES,
        pageSize: RESULTS_PER_PAGE,
        logger: this.logger,
      },
      (index) => this.searchPage(keyword, index + 1),
    );
  }

  /**
   * One page of a search, one-based.
   */
  private async searchPage(keyword: string, page: number): Promise<EuresJob[]> {
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
    if (!response.ok) throw new Error(`EURES search failed (${response.status})`);

    const body = (await response.json()) as EuresSearchResponse;
    return body.jvs ?? [];
  }
}
