/** API contract shared between the NestJS API and the Angular front. */

export const JOB_SOURCES = ['FRANCE_TRAVAIL', 'ADZUNA', 'ATS', 'EURES'] as const;
export type JobSource = (typeof JOB_SOURCES)[number];

/** Tabs of the UI: on-site offers in the configured area, fully remote ones, favourites. */
export const JOB_TABS = ['local', 'remote', 'favorites'] as const;
export type JobTab = (typeof JOB_TABS)[number];

/** Public runtime settings the front needs before rendering anything. */
export interface AppConfig {
  /** Name of the on-site tab, e.g. "Seine-Maritime". */
  areaLabel: string;
  authRequired: boolean;
}

/** What the list endpoint returns. The full description is left to the detail endpoint. */
export interface JobSummary {
  id: string;
  title: string;
  company: string | null;
  city: string | null;
  postalCode: string | null;
  isRemote: boolean;
  /** True when only the department is known, so the commute cannot be guaranteed. */
  isLocationApproximate: boolean;
  source: JobSource;
  sourceLabel: string;
  url: string;
  /** False when the source truncates the text: the detail page points to the original ad. */
  hasFullDescription: boolean;
  contractLabel: string | null;
  salary: string | null;
  /** First lines of the description, for the feed. */
  excerpt: string | null;
  isFavorite: boolean;
  isViewed: boolean;
  publishedAt: string | null;
  firstSeenAt: string;
  /** Other sources that published the same offer. */
  alternativeUrls: string[];
}

export interface JobDetail extends JobSummary {
  description: string | null;
  companyDescription: string | null;
}

export interface JobCounts {
  local: number;
  remote: number;
  favorites: number;
}

export interface JobListResponse {
  jobs: JobSummary[];
  counts: JobCounts;
  lastIngestionAt: string | null;
}

/** Result of one ingestion run, returned by the manual trigger endpoint. */
export interface IngestionSummary {
  fetched: number;
  kept: number;
  inserted: number;
  updated: number;
  merged: number;
  purged: number;
  skippedSources: string[];
  failedSources: string[];
}

/** Health of one source's last completed run, so the UI can flag a partial list. */
export interface SourceStatus {
  source: JobSource;
  /** False when the source has no credentials configured: it never runs. */
  enabled: boolean;
  lastRunAt: string | null;
  ok: boolean;
  error: string | null;
}
