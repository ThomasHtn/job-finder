import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../../config/search-profile.js';
import { htmlToText } from '../html-to-text.js';
import type { JobSourceConnector, RawJob } from '../source.types.js';

/**
 * Public search endpoint of the EURES portal.
 */
const SEARCH_URL =
  'https://europa.eu/eures/api/jv-searchengine/public/jv-search/search';
/**
 * Detail page linked from the UI.
 */
const DETAILS_URL = 'https://europa.eu/eures/portal/jv-se/jv-details';

/**
 * Page size and cap: two pages per keyword cover a region's recent offers.
 */
const RESULTS_PER_PAGE = 50;
const MAX_PAGES = 2;
/**
 * Politeness delay, the portal has no documented rate limit.
 */
const DELAY_BETWEEN_REQUESTS_MS = 700;

/**
 * Time given to one search request.
 */
const TIMEOUT_MS = 25_000;

/**
 * Promise-based pause.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**

 * Anything other than a direct hire is out of scope (temp work, apprenticeship, freelance).

 */
const DIRECT_HIRE = 'directhire';
/**
 * Wording that disqualifies a direct hire from being permanent.
 */
const NON_PERMANENT_TEXT =
  /\bcdd\b|int[ée]rim|\bstage\b|alternance|apprentissage/i;

/**
 * The fields read from one EURES vacancy.
 */
interface EuresJob {
  id: string;
  title: string;
  description?: string;
  creationDate?: number;
  positionOfferingCode?: string;
  employer?: { name?: string | null };
}

/**
 * EURES connector: region-level offers with no exact location.
 */
@Injectable()
export class EuresSource implements JobSourceConnector {
  /**
   * Identifier in logs and IngestionRun.
   */
  readonly name = 'EURES';
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(EuresSource.name);

  /**
   * Keywords and region come from the profile.
   */
  constructor(
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * Always enabled.
   */
  isEnabled(): boolean {
    /* Public API, no credentials needed. */
    return true;
  }

  /**
   * One search per keyword, deduplicated by id.
   */
  async fetchJobs(): Promise<RawJob[]> {
    const jobs = new Map<string, EuresJob>();

    for (const query of this.profile.keywords) {
      for (const job of await this.search(query)) {
        jobs.set(job.id, job);
      }
    }

    return [...jobs.values()].map((job) => this.toRawJob(job));
  }

  /**
   * Paged POST search for one keyword within the configured region.
   */
  private async search(keyword: string): Promise<EuresJob[]> {
    const collected: EuresJob[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);

      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultsPerPage: RESULTS_PER_PAGE,
          page,
          sortSearch: 'MOST_RECENT',
          keywords: [{ keyword, specificSearchCode: 'EVERYWHERE' }],
          publicationPeriod: null,
          occupationUris: [],
          skillUris: [],
          requiredExperienceCodes: [],
          positionScheduleCodes: [],
          sectorCodes: [],
          educationAndQualificationLevelCodes: [],
          positionOfferingCodes: [],
          /* EURES only locates offers at region level: the commute filter is skipped. */
          locationCodes: [this.profile.area.euresRegion],
          euresFlagCodes: [],
          otherBenefitsCodes: [],
          requiredLanguages: [],
          minNumberPost: null,
          sessionId: 'job-finder',
          requestLanguage: 'fr',
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(`Search "${keyword}" stopped at ${response.status}`);
        break;
      }

      const body = (await response.json()) as { jvs?: EuresJob[] };
      const results = body.jvs ?? [];
      collected.push(...results);
      if (results.length < RESULTS_PER_PAGE) break;
    }

    return collected;
  }

  /**
   * EURES vacancy to the source-agnostic shape.
   */
  private toRawJob(job: EuresJob): RawJob {
    const description = htmlToText(job.description);
    const isDirectHire = job.positionOfferingCode === DIRECT_HIRE;

    return {
      source: 'EURES',
      sourceId: job.id,
      sourceLabel: 'EURES',
      title: job.title,
      company: job.employer?.name ?? null,
      companyDescription: null,
      description,
      hasFullDescription: Boolean(description),
      contractLabel: isDirectHire
        ? 'Embauche directe'
        : (job.positionOfferingCode ?? null),
      isPermanent:
        isDirectHire &&
        !NON_PERMANENT_TEXT.test(`${job.title} ${description ?? ''}`)
          ? true
          : false,
      salary: null,
      /* Only the region is known, so no geocoding is attempted. */
      locationText: null,
      city: this.profile.area.label,
      postalCode: null,
      latitude: null,
      longitude: null,
      isRemote: false,
      isLocationApproximate: true,
      url: `${DETAILS_URL}/${job.id}?lang=fr`,
      publishedAt: job.creationDate ? new Date(job.creationDate) : null,
    };
  }
}
