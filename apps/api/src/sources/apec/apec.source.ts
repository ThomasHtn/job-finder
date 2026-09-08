import { Inject, Injectable, Logger } from '@nestjs/common';
import { sleep } from '../../common/sleep.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../../config/search-profile.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import {
  CDI_CONTRACT,
  DELAY_BETWEEN_REQUESTS_MS,
  FULL_REMOTE,
  LOCAL_MAX_PAGES,
  PAGE_SIZE,
  REMOTE_MAX_PAGES,
  SEARCH_URL,
  TIMEOUT_MS,
} from './apec.constants.js';
import { toRawJob } from './apec.mapper.js';
import type { ApecOffer } from './apec.types.js';

/**
 * APEC connector: executive-level offers, the densest French source for senior roles.
 */
@Injectable()
export class ApecSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  readonly name = 'APEC';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(ApecSource.name);

  /**
   * Place and keywords come from the profile.
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
   * Local and nationwide-remote passes per keyword, deduplicated by offer number.
   */
  async fetchJobs(): Promise<RawJob[]> {
    const offers = new Map<string, ApecOffer>();
    /* Offer numbers the remote facet matched: the teaser never states it. */
    const remoteIds = new Set<string>();

    for (const query of this.profile.keywords) {
      /* Within the configured macro-region. */
      for (const offer of await this.search(
        { motsCles: query, lieux: [this.profile.area.apecLocation] },
        LOCAL_MAX_PAGES,
      )) {
        offers.set(offer.numeroOffre, offer);
      }
      /* Nationwide, restricted to the full-remote tier. */
      for (const offer of await this.search(
        { motsCles: query, typesTeletravail: [FULL_REMOTE] },
        REMOTE_MAX_PAGES,
      )) {
        offers.set(offer.numeroOffre, offer);
        remoteIds.add(offer.numeroOffre);
      }
    }

    return [...offers.values()].map((offer) =>
      toRawJob(offer, remoteIds.has(offer.numeroOffre)),
    );
  }

  /**
   * One search, paged until a short page or the cap.
   */
  private async search(
    criteria: Record<string, unknown>,
    maxPages: number,
  ): Promise<ApecOffer[]> {
    const collected: ApecOffer[] = [];

    for (let page = 0; page < maxPages; page += 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);

      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...criteria,
          typeClient: 'CADRE',
          typesContrat: [CDI_CONTRACT],
          /* Newest first, so the page cap only ever drops the oldest offers. */
          sorts: [{ type: 'DATE', direction: 'DESCENDING' }],
          pagination: { range: PAGE_SIZE, startIndex: page * PAGE_SIZE },
          activeFiltre: true,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        /* Keep what was already collected rather than losing the whole source. */
        this.logger.warn(
          `Search ${JSON.stringify(criteria)} stopped at ${response.status}, keeping ${collected.length} offers`,
        );
        break;
      }

      const body = (await response.json()) as { resultats?: ApecOffer[] };
      const results = body.resultats ?? [];
      collected.push(...results);
      if (results.length < PAGE_SIZE) break;
    }

    return collected;
  }
}
