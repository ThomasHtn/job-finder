import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../../config/search-profile.js';
import type { JobSourceConnector, RawJob } from '../source.types.js';

/**
 * OAuth2 client-credentials endpoint.
 */
const TOKEN_URL =
  'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
/**
 * Offer search endpoint.
 */
const SEARCH_URL =
  'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';
/**
 * Scopes granted to the application.
 */
const SCOPE = 'api_offresdemploiv2 o2dsoffre';

/**

 * Straight-line km around the configured city, wider than the drive on purpose: the isochrone does the real cut.

 */
const SEARCH_RADIUS_KM = 60;
/**
 * Largest page the API accepts.
 */
const PAGE_SIZE = 150;
/**
 * Pages fetched around the configured city.
 */
const LOCAL_MAX_PAGES = 7;
/**
 * Nationwide remote sweep, kept short since the local filter does the sorting out.
 */
const REMOTE_MAX_PAGES = 2;

/**

 * The API rate-limits bursts, so requests are spaced out and 429s are retried.

 */
const DELAY_BETWEEN_REQUESTS_MS = 400;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 5_000;

/**
 * Time given to one search request.
 */
const SEARCH_TIMEOUT_MS = 20_000;

/**
 * Time given to the token endpoint.
 */
const TOKEN_TIMEOUT_MS = 15_000;

/**
 * Tokens are refreshed this early so one never expires mid-run.
 */
const TOKEN_REFRESH_MARGIN_S = 60;

/**
 * Promise-based pause.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * OAuth2 token payload.
 */
interface TokenResponse {
  access_token: string;
  expires_in: number;
}

/**
 * The fields read from one France Travail offer.
 */
interface FranceTravailOffer {
  id: string;
  intitule: string;
  description?: string;
  dateCreation?: string;
  typeContrat?: string;
  typeContratLibelle?: string;
  lieuTravail?: {
    libelle?: string;
    latitude?: number;
    longitude?: number;
    codePostal?: string;
    commune?: string;
  };
  entreprise?: { nom?: string; description?: string };
  salaire?: { libelle?: string };
  origineOffre?: { urlOrigine?: string };
  contexteTravail?: { conditionsExercice?: string[] };
}

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

    return [...offers.values()].map((offer) => this.toRawJob(offer));
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
   * France Travail offer to the source-agnostic shape.
   */
  private toRawJob(offer: FranceTravailOffer): RawJob {
    const conditions = offer.contexteTravail?.conditionsExercice ?? [];
    const place = offer.lieuTravail;

    return {
      source: 'FRANCE_TRAVAIL',
      sourceId: offer.id,
      sourceLabel: 'France Travail',
      title: offer.intitule,
      company: offer.entreprise?.nom ?? null,
      companyDescription: offer.entreprise?.description ?? null,
      description: offer.description ?? null,
      /* The search endpoint already returns the full text, no detail call needed. */
      hasFullDescription: Boolean(offer.description),
      contractLabel: offer.typeContratLibelle ?? offer.typeContrat ?? null,
      isPermanent: offer.typeContrat === 'CDI',
      salary: offer.salaire?.libelle ?? null,
      locationText: place?.libelle ?? null,
      /* `commune` is an INSEE code, unusable in the UI: the label carries the name. */
      city: cityFromLabel(place?.libelle),
      postalCode: place?.codePostal ?? null,
      latitude: place?.latitude ?? null,
      longitude: place?.longitude ?? null,
      /*
       * The API mostly says "Possibilité de télétravail", which is partial: only an
       * explicit full-remote wording counts, the text heuristic handles the rest.
       */
      isRemote: conditions.some((condition) =>
        /t[ée]l[ée]travail (total|complet|(a|à) 100)|100 ?% t[ée]l[ée]travail|full remote/i.test(
          condition,
        ),
      ),
      isLocationApproximate: false,
      url:
        offer.origineOffre?.urlOrigine ??
        `https://candidat.francetravail.fr/offres/recherche/detail/${offer.id}`,
      publishedAt: offer.dateCreation ? new Date(offer.dateCreation) : null,
    };
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

/**

 * Labels come as "76 - LE HAVRE" or plain "Le Havre"; keep only the town name.

 */
function cityFromLabel(label: string | undefined): string | null {
  if (!label) return null;
  const name = label.replace(/^\s*\d{2,3}\s*-\s*/, '').trim();
  if (!name) return null;
  /* Most labels are fully uppercased, which reads badly in the UI. */
  return name === name.toUpperCase()
    ? name
        .toLowerCase()
        .replace(
          /(^|[\s'-])([a-zà-ÿ])/g,
          (_, sep: string, char: string) => sep + char.toUpperCase(),
        )
    : name;
}
