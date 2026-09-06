import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../../config/search-profile.js';
import type { JobSourceConnector, RawJob } from '../source.types.js';

const TOKEN_URL =
  'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const SEARCH_URL =
  'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';
const SCOPE = 'api_offresdemploiv2 o2dsoffre';

/** Straight-line km around the configured city, wider than the drive on purpose: the isochrone does the real cut. */
const SEARCH_RADIUS_KM = 60;
const PAGE_SIZE = 150;
const LOCAL_MAX_PAGES = 7;
/** Nationwide remote sweep, kept short since the local filter does the sorting out. */
const REMOTE_MAX_PAGES = 2;

/** The API rate-limits bursts, so requests are spaced out and 429s are retried. */
const DELAY_BETWEEN_REQUESTS_MS = 400;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 5_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

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

@Injectable()
export class FranceTravailSource implements JobSourceConnector {
  readonly name = 'FRANCE_TRAVAIL';
  private readonly logger = new Logger(FranceTravailSource.name);
  private token: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  isEnabled(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  async fetchJobs(): Promise<RawJob[]> {
    const offers = new Map<string, FranceTravailOffer>();

    for (const query of this.profile.keywords) {
      // Around the configured city.
      for (const offer of await this.search({ motsCles: query }, 'local')) {
        offers.set(offer.id, offer);
      }
      // Nationwide, to catch fully remote offers located anywhere in France.
      for (const offer of await this.search(
        { motsCles: `${query} télétravail` },
        'remote',
      )) {
        offers.set(offer.id, offer);
      }
    }

    // Keyword search misses offers whose wording differs; the ROME code catches those.
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
        // Newest first, so the page cap only ever drops the oldest offers.
        sort: '1',
        range: `${from}-${from + PAGE_SIZE - 1}`,
      });
      if (scope === 'local') {
        params.set('commune', this.profile.area.insee);
        params.set('distance', String(SEARCH_RADIUS_KM));
      }

      const response = await this.searchRequest(params);

      // 204: no result for this query. 206: partial page, still valid.
      if (response.status === 204) break;
      if (!response.ok && response.status !== 206) {
        // Keep what was already collected rather than losing the whole source.
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

  /** Spaces out calls and retries on 429, which the API returns readily on bursts. */
  private async searchRequest(params: URLSearchParams): Promise<Response> {
    let response!: Response;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      response = await fetch(`${SEARCH_URL}?${params}`, {
        headers: { Authorization: `Bearer ${await this.getToken()}` },
        signal: AbortSignal.timeout(20_000),
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
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        `France Travail auth failed (${response.status}): ${await response.text()}`,
      );
    }

    const token = (await response.json()) as TokenResponse;
    // Refresh a minute early so a token never expires mid-run.
    this.token = {
      value: token.access_token,
      expiresAt: Date.now() + (token.expires_in - 60) * 1000,
    };
    return this.token.value;
  }

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
      // The search endpoint already returns the full text, no detail call needed.
      hasFullDescription: Boolean(offer.description),
      contractLabel: offer.typeContratLibelle ?? offer.typeContrat ?? null,
      isPermanent: offer.typeContrat === 'CDI',
      salary: offer.salaire?.libelle ?? null,
      locationText: place?.libelle ?? null,
      // `commune` is an INSEE code, unusable in the UI: the label carries the name.
      city: cityFromLabel(place?.libelle),
      postalCode: place?.codePostal ?? null,
      latitude: place?.latitude ?? null,
      longitude: place?.longitude ?? null,
      // The API mostly says "Possibilité de télétravail", which is partial: only an
      // explicit full-remote wording counts, the text heuristic handles the rest.
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

  private get clientId(): string | undefined {
    return this.config.get('FT_CLIENT_ID', { infer: true });
  }

  private get clientSecret(): string | undefined {
    return this.config.get('FT_CLIENT_SECRET', { infer: true });
  }
}

/** Labels come as "76 - LE HAVRE" or plain "Le Havre"; keep only the town name. */
function cityFromLabel(label: string | undefined): string | null {
  if (!label) return null;
  const name = label.replace(/^\s*\d{2,3}\s*-\s*/, '').trim();
  if (!name) return null;
  // Most labels are fully uppercased, which reads badly in the UI.
  return name === name.toUpperCase()
    ? name
        .toLowerCase()
        .replace(
          /(^|[\s'-])([a-zà-ÿ])/g,
          (_, sep: string, char: string) => sep + char.toUpperCase(),
        )
    : name;
}
