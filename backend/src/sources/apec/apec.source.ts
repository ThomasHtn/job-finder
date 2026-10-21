import { Inject, Injectable, Logger } from '@nestjs/common';

import { SEARCH_PROFILE, type SearchProfile } from '../../shared/config/search-profile.js';
import { collectPages } from '../collect-pages.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import { SearchTally } from '../search-tally.js';
import { sleep } from '../sleep.js';
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
import type { ApecOffer, ApecSearchResponse } from './apec.types.js';

/**
 * APEC connector: executive-level offers, the densest French source for senior roles.
 */
@Injectable()
export class ApecSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  public readonly name = 'APEC';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(ApecSource.name);

  /**
   * Place and keywords come from the profile.
   */
  constructor(@Inject(SEARCH_PROFILE) private readonly profile: SearchProfile) {}

  /**
   * Public endpoint, no credentials needed.
   */
  public isEnabled(): boolean {
    return true;
  }

  /**
   * Local and nationwide-remote passes per keyword, deduplicated by offer number.
   * A failing search is skipped; the source only fails when every search did.
   */
  public async fetchJobs(): Promise<RawJob[]> {
    const offers = new Map<string, ApecOffer>();
    /* Offer numbers the remote facet matched: the teaser never states it. */
    const remoteIds = new Set<string>();
    const tally = new SearchTally(this.logger);

    for (const query of this.profile.keywords) {
      /* Within the configured macro-region. */
      const local = { motsCles: query, lieux: [this.profile.area.apecLocation] };
      for (const offer of await tally.run(JSON.stringify(local), () =>
        this.search(local, LOCAL_MAX_PAGES),
      )) {
        offers.set(offer.numeroOffre, offer);
      }
      /* Nationwide, restricted to the full-remote tier. */
      const remote = { motsCles: query, typesTeletravail: [FULL_REMOTE] };
      for (const offer of await tally.run(JSON.stringify(remote), () =>
        this.search(remote, REMOTE_MAX_PAGES),
      )) {
        offers.set(offer.numeroOffre, offer);
        remoteIds.add(offer.numeroOffre);
      }
    }
    tally.throwIfAllFailed();

    return [...offers.values()].map((offer) => toRawJob(offer, remoteIds.has(offer.numeroOffre)));
  }

  /**
   * One search, paged until a short page or the cap.
   */
  private search(criteria: Record<string, unknown>, maxPages: number): Promise<ApecOffer[]> {
    return collectPages(
      { label: JSON.stringify(criteria), maxPages, pageSize: PAGE_SIZE, logger: this.logger },
      (page) => this.searchPage(criteria, page),
    );
  }

  /**
   * One page of a search, zero-based.
   */
  private async searchPage(criteria: Record<string, unknown>, page: number): Promise<ApecOffer[]> {
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
    if (!response.ok) throw new Error(`APEC search failed (${response.status})`);

    const body = (await response.json()) as ApecSearchResponse;
    return body.resultats ?? [];
  }
}
