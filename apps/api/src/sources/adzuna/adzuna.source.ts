import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../../config/search-profile.js';
import type { JobSourceConnector, RawJob } from '../source.types.js';

/**
 * Search endpoint, France only.
 */
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/fr/search';
/**
 * Largest page the API accepts.
 */
const RESULTS_PER_PAGE = 50;
/**
 * The free tier is 2500 requests/month. With a 2h cron (~360 runs/month), one page for
 * each of the first MAX_KEYWORDS queries plus two nationwide remote sweeps stays
 * around 1800/month, leaving headroom for manual `/api/ingestion/run` triggers.
 */
const MAX_PAGES = 1;
const MAX_KEYWORDS = 3;
/**
 * Straight-line km around the configured city, wider than the drive on purpose: the isochrone does the real cut.
 */
const SEARCH_RADIUS_KM = 60;

/**
 * Time given to one search request.
 */
const TIMEOUT_MS = 20_000;
/**
 * Exact phrases matched in the full ad, which the API sees even though it only
 * returns a snippet to us. Plain "télétravail" would also match hybrid roles.
 */
const REMOTE_PHRASES = ['full remote', '100% télétravail'] as const;

/**
 * The fields read from one Adzuna result.
 */
interface AdzunaJob {
  id: string;
  title: string;
  description?: string;
  created?: string;
  redirect_url: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  latitude?: number;
  longitude?: number;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
}

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
      this.toRawJob(job, remoteIds.has(job.id)),
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
        /* Adzuna keeps ads alive for years; anything older is a zombie. */
        max_days_old: '60',
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
   * Adzuna result to the source-agnostic shape.
   */
  private toRawJob(job: AdzunaJob, isRemote: boolean): RawJob {
    const areas = job.location?.area ?? [];
    return {
      source: 'ADZUNA',
      sourceId: job.id,
      sourceLabel: 'Adzuna',
      title: job.title,
      company: job.company?.display_name ?? null,
      companyDescription: null,
      description: job.description ?? null,
      /* Adzuna only exposes a truncated snippet, so the UI must link out. */
      hasFullDescription: false,
      contractLabel:
        job.contract_type === 'permanent' ? 'CDI' : (job.contract_type ?? null),
      isPermanent: job.contract_type === 'permanent',
      salary: formatSalary(job.salary_min, job.salary_max),
      locationText: job.location?.display_name ?? null,
      /* Adzuna orders areas from country down to the most precise level. */
      city: areas.at(-1) ?? job.location?.display_name ?? null,
      postalCode: null,
      latitude: job.latitude ?? null,
      longitude: job.longitude ?? null,
      isRemote,
      isLocationApproximate: false,
      url: job.redirect_url,
      publishedAt: job.created ? new Date(job.created) : null,
    };
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

/**
 * Yearly range in euros, French formatting; null when the API gives nothing.
 */
function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const format = (value: number) =>
    `${Math.round(value).toLocaleString('fr-FR')} €`;
  if (min && max && min !== max)
    return `${format(min)} - ${format(max)} par an`;
  return `${format((min ?? max)!)} par an`;
}
