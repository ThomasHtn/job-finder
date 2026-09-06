import type { JobSourceType } from '../generated/prisma/enums.js';

/** A job as returned by a source, before filtering and deduplication. */
export interface RawJob {
  source: JobSourceType;
  sourceId: string;
  /** Shown in the UI, e.g. "France Travail" or "Doctolib (Greenhouse)". */
  sourceLabel: string;

  title: string;
  company: string | null;
  companyDescription: string | null;
  description: string | null;
  /** False when the source truncates the text: the UI links out instead of opening a detail page. */
  hasFullDescription: boolean;

  contractLabel: string | null;
  /** null when the source does not say; the ingestion falls back to a text heuristic. */
  isPermanent: boolean | null;
  salary: string | null;

  /** Free-form location used for geocoding when coordinates are missing. */
  locationText: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isRemote: boolean;
  /** True when the source only knows the department: the commute filter is skipped, the UI says so. */
  isLocationApproximate: boolean;

  url: string;
  publishedAt: Date | null;
}

export interface JobSourceConnector {
  /** Stable identifier used in logs and in the IngestionRun table. */
  readonly name: string;
  /** False when credentials are missing: the source is skipped, not failed. */
  isEnabled(): boolean;
  fetchJobs(): Promise<RawJob[]>;
}

export const JOB_SOURCE_CONNECTORS = Symbol('JOB_SOURCE_CONNECTORS');
