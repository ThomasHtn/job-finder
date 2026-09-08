import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../../config/search-profile.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import {
  BASE_URL,
  MAX_DAYS_OLD,
  MAX_KEYWORDS,
  MAX_PAGES,
  REMOTE_PHRASES,
  RESULTS_PER_PAGE,
  SEARCH_RADIUS_KM,
  TIMEOUT_MS,
} from './adzuna.constants.js';
import { toRawJob } from './adzuna.mapper.js';
import type { AdzunaJob } from './adzuna.types.js';

/**
 * Adzuna connector: snippet-only source, kept for its breadth.
 */
@Injectable()
export class AdzunaSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  readonly name = 'ADZUNA';

  /**
   * Credentials from the environment, place and keywords from the profile.
   */
  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * Both keys are needed; without them the source is skipped.
   */
  isEnabled(): boolean {
    return Boolean(this.appId && this.appKey);
  }

  /**
   * Local pass on the first keywords, then a nationwide sweep for remote phrases.
   */
  async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<string, AdzunaJob>();
    /* Ids found by the remote sweep: the phrase matched in the full ad, not just the snippet. */
    const remoteIds = new Set<string>();

    const keywords = this.profile.keywords.slice(0, MAX_KEYWORDS);
    for (const query of keywords) {
      for (const job of await this.search({ what: query }, 'local')) {
        jobs.set(job.id, job);
      }
    }
    /* Nationwide sweep on the first (broadest) query only, to stay within the quota. */
    for (const phrase of REMOTE_PHRASES) {
      for (const job of await this.search(
        { what: keywords[0], what_phrase: phrase },
        'remote',
      )) {
        jobs.set(job.id, job);
        remoteIds.add(job.id);
      }
    }

    return [...jobs.values()].map((job) =>
      toRawJob(job, remoteIds.has(job.id)),
    );
  }

  /**
   * One search, paged up to MAX_PAGES.
   */
  private async search(
    criteria: Record<string, string>,
    scope: 'local' | 'remote',
  ): Promise<AdzunaJob[]> {
    const collected: AdzunaJob[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const params = new URLSearchParams({
        app_id: this.appId!,
        app_key: this.appKey!,
        results_per_page: String(RESULTS_PER_PAGE),
        ...criteria,
        /* Adzuna's permanent-contract filter; `contract_type` is output only and gets a 400. */
        permanent: '1',
        /* Newest first, so the single page holds what changed since the last run. */
        sort_by: 'date',
        max_days_old: String(MAX_DAYS_OLD),
        'content-type': 'application/json',
      });
      if (scope === 'local') {
        params.set('where', this.profile.area.city);
        params.set('distance', String(SEARCH_RADIUS_KM));
      }

      const response = await fetch(`${BASE_URL}/${page}?${params}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(
          `Adzuna search failed (${response.status}): ${await response.text()}`,
        );
      }

      const body = (await response.json()) as { results?: AdzunaJob[] };
      const results = body.results ?? [];
      collected.push(...results);
      if (results.length < RESULTS_PER_PAGE) break;
    }

    return collected;
  }

  /**
   * Application id, undefined when not configured.
   */
  private get appId(): string | undefined {
    return this.config.get('ADZUNA_APP_ID', { infer: true });
  }

  /**
   * Application key, undefined when not configured.
   */
  private get appKey(): string | undefined {
    return this.config.get('ADZUNA_APP_KEY', { infer: true });
  }
}
