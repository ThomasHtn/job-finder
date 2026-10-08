import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { sleep } from '../../common/sleep.js';
import type { Env } from '../../config/env.schema.js';
import { SEARCH_PROFILE, type SearchProfile } from '../../config/search-profile.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import {
  BASE_URL,
  MAX_DAYS_OLD,
  MAX_KEYWORDS,
  MAX_PAGES,
  MAX_RETRIES,
  REMOTE_PHRASES,
  RESULTS_PER_PAGE,
  RETRY_BACKOFF_MS,
  SEARCH_RADIUS_KM,
  TIMEOUT_MS,
} from './adzuna.constants.js';
import { toRawJob } from './adzuna.mapper.js';
import type { AdzunaJob } from './adzuna.types.js';
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
    const failures: Error[] = [];
    let succeeded = 0;

    /* Runs one search, recording its failure instead of losing the other queries. */
    const collect = async (
      criteria: Record<string, string>,
      scope: 'local' | 'remote',
    ): Promise<AdzunaJob[]> => {
      try {
        const results = await this.search(criteria, scope);
        succeeded += 1;
        return results;
      } catch (error) {
        failures.push(error as Error);
        this.logger.warn(`Search ${JSON.stringify(criteria)} skipped: ${(error as Error).message}`);
        return [];
      }
    };

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

    if (succeeded === 0 && failures.length > 0) throw failures[0];

    return [...jobs.values()].map((job) => toRawJob(job, remoteIds.has(job.id)));
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

      const response = await this.request(`${BASE_URL}/${page}?${params}`);
      if (!response.ok) {
        throw new Error(await describeFailure(response));
      }

      const body = (await response.json()) as { results?: AdzunaJob[] };
      const results = body.results ?? [];
      collected.push(...results);
      if (results.length < RESULTS_PER_PAGE) break;
    }

    return collected;
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
