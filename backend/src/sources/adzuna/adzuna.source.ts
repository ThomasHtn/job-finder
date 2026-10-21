import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../shared/config/env.schema.js';
import { SEARCH_PROFILE, type SearchProfile } from '../../shared/config/search-profile.js';
import { collectPages } from '../collect-pages.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import type { SearchScope } from '../search-scope.js';
import { SearchTally } from '../search-tally.js';
import { sleep } from '../sleep.js';
import {
  BASE_URL,
  MAX_DAYS_OLD,
  MAX_KEYWORDS,
  MAX_PAGES,
  MAX_RETRIES,
  REMOTE_PHRASES,
  RESULTS_PER_PAGE,
  RETRY_BACKOFF_MS,
  TIMEOUT_MS,
} from './adzuna.constants.js';
import { toRawJob } from './adzuna.mapper.js';
import type { AdzunaJob, AdzunaSearchResponse } from './adzuna.types.js';
import { describeFailure } from './describe-failure.js';
import { isTransientStatus } from './is-transient-status.js';

/**
 * Adzuna connector: snippet-only source, kept for its breadth.
 */
@Injectable()
export class AdzunaSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  public readonly name = 'ADZUNA';

  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(AdzunaSource.name);

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
  public isEnabled(): boolean {
    return Boolean(this.appId && this.appKey);
  }

  /**
   * Local pass on the first keywords, then a nationwide sweep for remote phrases.
   * A failing query is skipped; the source only fails when every query did.
   */
  public async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<string, AdzunaJob>();
    /* Ids found by the remote sweep: the phrase matched in the full ad, not just the snippet. */
    const remoteIds = new Set<string>();
    const tally = new SearchTally(this.logger);
    const collect = (criteria: Record<string, string>, scope: SearchScope) =>
      tally.run(JSON.stringify(criteria), () => this.search(criteria, scope));

    const keywords = this.profile.keywords.slice(0, MAX_KEYWORDS);
    for (const query of keywords) {
      for (const job of await collect({ what: query }, 'local')) {
        jobs.set(job.id, job);
      }
    }
    /* Nationwide sweep on the first (broadest) query only, to stay within the quota. */
    for (const phrase of REMOTE_PHRASES) {
      for (const job of await collect({ what: keywords[0], what_phrase: phrase }, 'remote')) {
        jobs.set(job.id, job);
        remoteIds.add(job.id);
      }
    }

    tally.throwIfAllFailed();

    return [...jobs.values()].map((job) => toRawJob(job, remoteIds.has(job.id)));
  }

  /**
   * One search, paged up to MAX_PAGES.
   */
  private search(criteria: Record<string, string>, scope: SearchScope): Promise<AdzunaJob[]> {
    return collectPages(
      {
        label: JSON.stringify(criteria),
        maxPages: MAX_PAGES,
        pageSize: RESULTS_PER_PAGE,
        logger: this.logger,
      },
      (index) => this.searchPage(criteria, scope, index + 1),
    );
  }

  /**
   * One page of a search, one-based.
   */
  private async searchPage(
    criteria: Record<string, string>,
    scope: SearchScope,
    page: number,
  ): Promise<AdzunaJob[]> {
    const params = new URLSearchParams({
      app_id: this.appId!,
      app_key: this.appKey!,
      results_per_page: String(RESULTS_PER_PAGE),
      ...criteria,
      /* Adzuna's permanent-contract filter; `contract_type` is output only and gets a 400. */
      permanent: '1',
      /* Newest first, so the first page holds what changed since the last run. */
      sort_by: 'date',
      max_days_old: String(MAX_DAYS_OLD),
      'content-type': 'application/json',
    });
    if (scope === 'local') {
      params.set('where', this.profile.area.city);
      /* A straight line is never longer than the road: this radius holds the whole drive. */
      params.set('distance', String(this.profile.area.driveKm));
    }

    const response = await this.request(`${BASE_URL}/${page}?${params}`);
    if (!response.ok) {
      throw new Error(await describeFailure(response));
    }

    const body = (await response.json()) as AdzunaSearchResponse;
    return body.results ?? [];
  }

  /**
   * GET retried with a growing backoff on transient statuses and timeouts.
   */
  private async request(url: string): Promise<Response> {
    for (let attempt = 0; ; attempt += 1) {
      const last = attempt === MAX_RETRIES;
      let reason: string;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (last || !isTransientStatus(response.status)) return response;
        reason = `status ${response.status}`;
        /* Frees the connection held by the unread error page. */
        await response.body?.cancel();
      } catch (error) {
        /* Timeouts and network resets are as transient as a 503. */
        if (last) throw error;
        reason = (error as Error).message;
      }

      const wait = RETRY_BACKOFF_MS * 2 ** attempt;
      this.logger.warn(
        `Adzuna ${reason}, retrying in ${wait}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
      );
      await sleep(wait);
    }
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
