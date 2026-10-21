import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../shared/config/env.schema.js';
import { SEARCH_PROFILE, type SearchProfile } from '../../shared/config/search-profile.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import { SearchTally } from '../search-tally.js';
import { sleep } from '../sleep.js';
import {
  BASE_URL,
  DELAY_BETWEEN_REQUESTS_MS,
  MAX_KEYWORDS,
  MAX_RADIUS_KM,
  RESULTS_PER_PAGE,
  TIMEOUT_MS,
} from './jooble.constants.js';
import { toRawJob } from './jooble.mapper.js';
import type { JoobleJob, JoobleSearchResponse } from './jooble.types.js';
import { joobleId } from './jooble-id.js';

/**
 * Jooble connector: an aggregator, snippet-only, kept for the boards it reaches that others miss.
 */
@Injectable()
export class JoobleSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  public readonly name = 'JOOBLE';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(JoobleSource.name);

  /**
   * Key from the environment, place and keywords from the profile.
   */
  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * Skipped until a key is configured.
   */
  public isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * One query per leading keyword around the configured city, deduplicated by offer id: the link
   * may carry query-specific parameters.
   * A failing query is skipped; the source only fails when every query did.
   */
  public async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<string, JoobleJob>();
    const tally = new SearchTally(this.logger);

    for (const [index, keywords] of this.profile.keywords.slice(0, MAX_KEYWORDS).entries()) {
      if (index > 0) await sleep(DELAY_BETWEEN_REQUESTS_MS);
      for (const job of await tally.run(`"${keywords}"`, () => this.search(keywords))) {
        jobs.set(joobleId(job.link), job);
      }
    }
    tally.throwIfAllFailed();

    return [...jobs.values()].map(toRawJob);
  }

  /**
   * One search, first page only.
   */
  private async search(keywords: string): Promise<JoobleJob[]> {
    const response = await fetch(`${BASE_URL}/${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords,
        location: this.profile.area.city,
        /* The API takes its numbers as strings. */
        radius: String(Math.min(this.profile.area.driveKm, MAX_RADIUS_KM)),
        page: '1',
        ResultOnPage: String(RESULTS_PER_PAGE),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      /* The body may be a whole HTML page (Cloudflare challenge): the status says enough. */
      throw new Error(`Jooble search failed (${response.status})`);
    }

    const body = (await response.json()) as JoobleSearchResponse;
    return body.jobs ?? [];
  }

  /**
   * API key, undefined when not configured.
   */
  private get apiKey(): string | undefined {
    return this.config.get('JOOBLE_API_KEY', { infer: true });
  }
}
