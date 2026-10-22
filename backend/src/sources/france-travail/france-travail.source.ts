import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../shared/config/env.schema.js';
import { SEARCH_PROFILE } from '../../shared/config/search-profile.token.js';
import type { SearchProfile } from '../../shared/config/search-profile.types.js';
import { SECOND_MS } from '../../shared/helpers/time.constants.js';
import { collectPages } from '../collect-pages.js';
import type { JobSourceConnector } from '../job-source-connector.types.js';
import { postForm } from '../post-form.js';
import type { RawJob } from '../raw-job.js';
import type { SearchScope } from '../search-scope.js';
import { SearchTally } from '../search-tally.js';
import { sleep } from '../sleep.js';
import {
  DELAY_BETWEEN_REQUESTS_MS,
  LOCAL_MAX_PAGES,
  MAX_RETRIES,
  PAGE_SIZE,
  PERMANENT_CONTRACT,
  REMOTE_MAX_PAGES,
  RETRY_BACKOFF_MS,
  SCOPE,
  SEARCH_TIMEOUT_MS,
  SEARCH_URL,
  SORT_NEWEST_FIRST,
  TOKEN_REFRESH_MARGIN_S,
  TOKEN_TIMEOUT_MS,
  TOKEN_URL,
} from './france-travail.constants.js';
import { toRawJob } from './france-travail.mapper.js';
import type {
  CachedToken,
  FranceTravailOffer,
  FranceTravailSearchResponse,
  TokenResponse,
} from './france-travail.types.js';
import { tokenLifetimeSeconds } from './token-lifetime.js';

/**
 * France Travail connector: the richest source, full text and coordinates included.
 */
@Injectable()
export class FranceTravailSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  public readonly name = 'FRANCE_TRAVAIL';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(FranceTravailSource.name);
  /**
   * Cached bearer token with its expiry.
   */
  private token: CachedToken | null = null;

  /**
   * Credentials from the environment, place and keywords from the profile.
   */
  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * Both OAuth credentials are needed; without them the source is skipped.
   */
  public isEnabled(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Local and nationwide-remote passes per keyword, plus the ROME code when set.
   * A failing search is skipped; the source only fails when every search did.
   */
  public async fetchJobs(): Promise<RawJob[]> {
    const offers = new Map<string, FranceTravailOffer>();
    const tally = new SearchTally(this.logger);
    const searches: [Record<string, string>, SearchScope][] = this.profile.keywords.flatMap(
      (query): [Record<string, string>, SearchScope][] => [
        /* Around the configured city. */
        [{ motsCles: query }, 'local'],
        /* Nationwide, to catch fully remote offers located anywhere in France. */
        [{ motsCles: `${query} télétravail` }, 'remote'],
      ],
    );
    /* Keyword search misses offers whose wording differs; the ROME code catches those. */
    const { romeCode } = this.profile;
    if (romeCode) {
      searches.push([{ codeROME: romeCode }, 'local']);
      searches.push([{ codeROME: romeCode, motsCles: 'télétravail' }, 'remote']);
    }

    for (const [criteria, scope] of searches) {
      for (const offer of await tally.run(JSON.stringify(criteria), () =>
        this.search(criteria, scope),
      )) {
        offers.set(offer.id, offer);
      }
    }
    tally.throwIfAllFailed();

    return [...offers.values()].map(toRawJob);
  }

  /**
   * One search, paged until a short page or the cap.
   */
  private search(
    criteria: Record<string, string>,
    scope: SearchScope,
  ): Promise<FranceTravailOffer[]> {
    return collectPages(
      {
        label: JSON.stringify(criteria),
        maxPages: scope === 'local' ? LOCAL_MAX_PAGES : REMOTE_MAX_PAGES,
        pageSize: PAGE_SIZE,
        logger: this.logger,
      },
      (page) => this.searchPage(criteria, scope, page),
    );
  }

  /**
   * One page of a search, zero-based.
   */
  private async searchPage(
    criteria: Record<string, string>,
    scope: SearchScope,
    page: number,
  ): Promise<FranceTravailOffer[]> {
    const from = page * PAGE_SIZE;
    const params = new URLSearchParams({
      ...criteria,
      typeContrat: PERMANENT_CONTRACT,
      /* Newest first, so the page cap only ever drops the oldest offers. */
      sort: SORT_NEWEST_FIRST,
      range: `${from}-${from + PAGE_SIZE - 1}`,
    });
    if (scope === 'local') {
      params.set('commune', this.profile.area.insee);
      /* A straight line is never longer than the road: this radius holds the whole drive. */
      params.set('distance', String(this.profile.area.driveKm));
    }

    const response = await this.searchRequest(params);

    /* 204: no result for this query. 206, a partial page, is still ok. */
    if (response.status === 204) return [];
    if (!response.ok) throw new Error(`France Travail search failed (${response.status})`);

    const body = (await response.json()) as FranceTravailSearchResponse;
    return body.resultats ?? [];
  }

  /**
   * Spaces out calls and retries on 429, which the API returns readily on bursts.
   */
  private async searchRequest(params: URLSearchParams): Promise<Response> {
    for (let attempt = 0; ; attempt += 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      const response = await fetch(`${SEARCH_URL}?${params}`, {
        headers: { Authorization: `Bearer ${await this.getToken()}` },
        signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
      });

      /* The last 429 is answered as is: waiting once more would only delay the failure. */
      if (response.status !== 429 || attempt === MAX_RETRIES) return response;

      const retryAfter = Number(response.headers.get('Retry-After'));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * SECOND_MS : RETRY_BACKOFF_MS;
      this.logger.warn(`Rate limited, waiting ${wait}ms (retry ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(wait);
    }
  }

  /**
   * Returns the cached token or fetches a new one.
   */
  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;

    const token = await postForm<TokenResponse>(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        scope: SCOPE,
      }),
      { label: 'France Travail auth', timeoutMs: TOKEN_TIMEOUT_MS },
    );
    this.token = {
      value: token.access_token,
      expiresAt: Date.now() + (tokenLifetimeSeconds(token) - TOKEN_REFRESH_MARGIN_S) * SECOND_MS,
    };
    return this.token.value;
  }

  /**
   * OAuth client id, undefined when not configured.
   */
  private get clientId(): string | undefined {
    return this.config.get('FT_CLIENT_ID', { infer: true });
  }

  /**
   * OAuth client secret, undefined when not configured.
   */
  private get clientSecret(): string | undefined {
    return this.config.get('FT_CLIENT_SECRET', { infer: true });
  }
}
