/**
 * API contract shared between the NestJS API and the Angular front.
 * Every type here is consumed by both sides: change it first, then the mappers.
 */

/**
 * Identifiers of the job boards the API ingests from.
 */
export const JOB_SOURCES = ['FRANCE_TRAVAIL', 'ADZUNA', 'ATS', 'EURES'] as const;

/**
 * One of the known job sources.
 */
export type JobSource = (typeof JOB_SOURCES)[number];

/**
 * Tabs of the UI: on-site offers in the configured area, fully remote ones, favourites.
 */
export const JOB_TABS = ['local', 'remote', 'favorites'] as const;

/**
 * One of the UI tabs.
 */
export type JobTab = (typeof JOB_TABS)[number];

/**
 * Tab shown when none (or an unknown one) is requested.
 */
export const DEFAULT_JOB_TAB: JobTab = 'local';

/**
 * Narrows any user-provided value (query param, route input) to a known tab.
 * Unknown values fall back to the default tab instead of failing.
 */
export function toJobTab(value: unknown): JobTab {
  return JOB_TABS.includes(value as JobTab) ? (value as JobTab) : DEFAULT_JOB_TAB;
}

/**
 * Public runtime settings the front needs before rendering anything.
 */
export interface AppConfig {
  /**
   * Name of the on-site tab, e.g. "Seine-Maritime".
   */
  areaLabel: string;

  /**
   * True when the API is protected by a password: the front shows the login screen.
   */
  authRequired: boolean;
}

/**
 * What the list endpoint returns. The full description is left to the detail endpoint.
 */
export interface JobSummary {
  /**
   * Database identifier.
   */
  id: string;

  /**
   * Title as published by the source.
   */
  title: string;

  /**
   * Hiring company, when the source names it.
   */
  company: string | null;

  /**
   * Town of the position, when known.
   */
  city: string | null;

  /**
   * Postal code of the position, when known.
   */
  postalCode: string | null;

  /**
   * True for fully remote positions.
   */
  isRemote: boolean;

  /**
   * True when only the department is known, so the commute cannot be guaranteed.
   */
  isLocationApproximate: boolean;

  /**
   * Source the offer was first ingested from.
   */
  source: JobSource;

  /**
   * Human readable origin, e.g. "France Travail" or "Doctolib (Greenhouse)".
   */
  sourceLabel: string;

  /**
   * Link to the original ad.
   */
  url: string;

  /**
   * False when the source truncates the text: the detail page points to the original ad.
   */
  hasFullDescription: boolean;

  /**
   * Contract wording from the source, e.g. "CDI" or "Full-time".
   */
  contractLabel: string | null;

  /**
   * Salary wording from the source, never parsed.
   */
  salary: string | null;

  /**
   * First lines of the description, for the feed.
   */
  excerpt: string | null;

  /**
   * Starred by the user.
   */
  isFavorite: boolean;

  /**
   * Detail page opened at least once.
   */
  isViewed: boolean;

  /**
   * Publication date on the source, ISO 8601.
   */
  publishedAt: string | null;

  /**
   * First time the ingestion saw the offer, ISO 8601.
   */
  firstSeenAt: string;

  /**
   * Other sources that published the same offer.
   */
  alternativeUrls: string[];
}

/**
 * Full offer, returned by the detail endpoint.
 */
export interface JobDetail extends JobSummary {
  /**
   * Plain-text description, when the source exposes one.
   */
  description: string | null;

  /**
   * Plain-text presentation of the company, when the source exposes one.
   */
  companyDescription: string | null;
}

/**
 * Number of offers behind each tab.
 */
export interface JobCounts {
  /**
   * On-site offers in the commuting area.
   */
  local: number;

  /**
   * Fully remote offers.
   */
  remote: number;

  /**
   * Starred offers.
   */
  favorites: number;
}

/**
 * Payload of the list endpoint.
 */
export interface JobListResponse {
  /**
   * Offers of the requested tab, newest first.
   */
  jobs: JobSummary[];

  /**
   * Counts for every tab, so the segmented control stays in sync.
   */
  counts: JobCounts;

  /**
   * End of the last successful ingestion, ISO 8601.
   */
  lastIngestionAt: string | null;
}

/**
 * Result of one ingestion run, returned by the manual trigger endpoint.
 */
export interface IngestionSummary {
  /**
   * Raw offers returned by every source.
   */
  fetched: number;

  /**
   * Offers that passed the filters.
   */
  kept: number;

  /**
   * Offers seen for the first time.
   */
  inserted: number;

  /**
   * Offers already known from the same source.
   */
  updated: number;

  /**
   * Offers merged into a twin from another source.
   */
  merged: number;

  /**
   * Stale offers deleted at the end of the run.
   */
  purged: number;

  /**
   * Sources without credentials, never called.
   */
  skippedSources: string[];

  /**
   * Sources whose fetch failed during this run.
   */
  failedSources: string[];
}

/**
 * Health of one source's last completed run, so the UI can flag a partial list.
 */
export interface SourceStatus {
  /**
   * Source identifier.
   */
  source: JobSource;

  /**
   * False when the source has no credentials configured: it never runs.
   */
  enabled: boolean;

  /**
   * End of the last completed run, ISO 8601.
   */
  lastRunAt: string | null;

  /**
   * True when enabled and the last run succeeded.
   */
  ok: boolean;

  /**
   * Error message of the last run, when it failed.
   */
  error: string | null;
}
