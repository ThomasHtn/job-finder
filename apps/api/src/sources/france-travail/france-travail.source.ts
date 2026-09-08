import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sleep } from '../../common/sleep.js';
import type { Env } from '../../config/env.schema.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../../config/search-profile.js';
import type { JobSourceConnector } from '../job-source-connector.js';
import type { RawJob } from '../raw-job.js';
import {
  DELAY_BETWEEN_REQUESTS_MS,
  LOCAL_MAX_PAGES,
  MAX_RETRIES,
  PAGE_SIZE,
  REMOTE_MAX_PAGES,
  RETRY_BACKOFF_MS,
  SCOPE,
  SEARCH_RADIUS_KM,
  SEARCH_TIMEOUT_MS,
  SEARCH_URL,
  TOKEN_REFRESH_MARGIN_S,
  TOKEN_TIMEOUT_MS,
  TOKEN_URL,
} from './france-travail.constants.js';
import { toRawJob } from './france-travail.mapper.js';
import type {
  FranceTravailOffer,
  TokenResponse,
} from './france-travail.types.js';

/**
 * France Travail connector: the richest source, full text and coordinates included.
 */
@Injectable()
export class FranceTravailSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  readonly name = 'FRANCE_TRAVAIL';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(FranceTravailSource.name);
  /**
   * Cached bearer token with its expiry.
   */
  private token: { value: string; expiresAt: number } | null = null;

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
  isEnabled(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Local and nationwide-remote passes per keyword, plus the ROME code when set.
   */
  async fetchJobs(): Promise<RawJob[]> {
    const offers = new Map<string, FranceTravailOffer>();

    for (const query of this.profile.keywords) {
      /* Around the configured city. */
      for (const offer of await this.search({ motsCles: query }, 'local')) {
        offers.set(offer.id, offer);
      }
      /* Nationwide, to catch fully remote offers located anywhere in France. */
      for (const offer of await this.search(
        { motsCles: `${query} télétravail` },
        'remote',
      )) {
        offers.set(offer.id, offer);
      }
    }

    /* Keyword search misses offers whose wording differs; the ROME code catches those. */
    const { romeCode } = this.profile;
    if (romeCode) {
      for (const offer of await this.search({ codeROME: romeCode }, 'local')) {
        offers.set(offer.id, offer);
      }
      for (const offer of await this.search(
        { codeROME: romeCode, motsCles: 'télétravail' },
        'remote',
      )) {
        offers.set(offer.id, offer);
      }
    }

    return [...offers.values()].map(toRawJob);
  }

  /**
   * One search, paged until a short page or the cap.
   */
  private async search(
    criteria: Record<string, string>,
    scope: 'local' | 'remote',
  ): Promise<FranceTravailOffer[]> {
    const maxPages = scope === 'local' ? LOCAL_MAX_PAGES : REMOTE_MAX_PAGES;
    const collected: FranceTravailOffer[] = [];

    for (let page = 0; page < maxPages; page += 1) {
      const from = page * PAGE_SIZE;
      const params = new URLSearchParams({
        ...criteria,
        typeContrat: 'CDI',
        /* Newest first, so the page cap only ever drops the oldest offers. */
        sort: '1',
        range: `${from}-${from + PAGE_SIZE - 1}`,
      });
      if (scope === 'local') {
        params.set('commune', this.profile.area.insee);
        params.set('distance', String(SEARCH_RADIUS_KM));
      }

      const response = await this.searchRequest(params);

      /* 204: no result for this query. 206: partial page, still valid. */
      if (response.status === 204) break;
      if (!response.ok && response.status !== 206) {
        /* Keep what was already collected rather than losing the whole source. */
        this.logger.warn(
          `Search ${JSON.stringify(criteria)} stopped at ${response.status}, keeping ${collected.length} offers`,
        );
        break;
      }

      const body = (await response.json()) as {
        resultats?: FranceTravailOffer[];
      };
      const results = body.resultats ?? [];
      collected.push(...results);
      if (results.length < PAGE_SIZE) break;
    }

    return collected;
  }

  /**
   * Spaces out calls and retries on 429, which the API returns readily on bursts.
   */
  private async searchRequest(params: URLSearchParams): Promise<Response> {
    let response!: Response;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      response = await fetch(`${SEARCH_URL}?${params}`, {
        headers: { Authorization: `Bearer ${await this.getToken()}` },
        signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
      });

      if (response.status !== 429) return response;

      const retryAfter = Number(response.headers.get('Retry-After'));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : RETRY_BACKOFF_MS;
      this.logger.warn(
        `Rate limited, waiting ${wait}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
      );
      await sleep(wait);
    }

    return response;
  }

  /**
   * Returns the cached token or fetches a new one.
   */
  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now())
      return this.token.value;

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        scope: SCOPE,
      }),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(
        `France Travail auth failed (${response.status}): ${await response.text()}`,
      );
    }

    const token = (await response.json()) as TokenResponse;
    this.token = {
      value: token.access_token,
      expiresAt: Date.now() + (token.expires_in - TOKEN_REFRESH_MARGIN_S) * 1000,
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
