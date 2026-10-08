import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { sleep } from '../../common/sleep.js';
import type { Env } from '../../config/env.schema.js';
import { SEARCH_PROFILE, type SearchProfile } from '../../config/search-profile.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import {
  BASE_URL,
  DELAY_BETWEEN_REQUESTS_MS,
  MAX_KEYWORDS,
  RESULTS_PER_PAGE,
  SEARCH_RADIUS_KM,
  TIMEOUT_MS,
} from './jooble.constants.js';
import { toRawJob } from './jooble.mapper.js';
import type { JoobleJob } from './jooble.types.js';

/**
 * Jooble connector: an aggregator, snippet-only, kept for the boards it reaches that others miss.
 */
@Injectable()
export class JoobleSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  readonly name = 'JOOBLE';

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
  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * One query per leading keyword around the configured city, deduplicated by link.
   */
  async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<string, JoobleJob>();

    for (const keywords of this.profile.keywords.slice(0, MAX_KEYWORDS)) {
      for (const job of await this.search(keywords)) {
        jobs.set(job.link, job);
      }
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }

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
        radius: SEARCH_RADIUS_KM,
        page: '1',
        ResultOnPage: RESULTS_PER_PAGE,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      /* The body may be a whole HTML page (Cloudflare challenge): the status says enough. */
      throw new Error(`Jooble search failed (${response.status})`);
    }

    const body = (await response.json()) as { jobs?: JoobleJob[] };
    return body.jobs ?? [];
  }

  /**
   * API key, undefined when not configured.
   */
  private get apiKey(): string | undefined {
    return this.config.get('JOOBLE_API_KEY', { infer: true });
  }
}
