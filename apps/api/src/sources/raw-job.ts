import type { JobSourceType } from '../generated/prisma/enums.js';

/**
 * A job as returned by a source, before filtering and deduplication.
 */
export interface RawJob {
  /**
   * Source the offer comes from.
   */
  source: JobSourceType;

  /**
   * Identifier on that source, unique together with `source`.
   */
  sourceId: string;

  /**
   * Shown in the UI, e.g. "France Travail" or "Doctolib (Greenhouse)".
   */
  sourceLabel: string;

  /**
   * Title as published.
   */
  title: string;

  /**
   * Hiring company, when named.
   */
  company: string | null;

  /**
   * Presentation of the company, when the source separates it from the ad.
   */
  companyDescription: string | null;

  /**
   * Plain-text description, when available.
   */
  description: string | null;

  /**
   * False when the source truncates the text: the UI links out instead of opening a detail page.
   */
  hasFullDescription: boolean;

  /**
   * Contract wording from the source.
   */
  contractLabel: string | null;

  /**
   * null when the source does not say; the ingestion falls back to a text heuristic.
   */
  isPermanent: boolean | null;

  /**
   * Salary wording from the source.
   */
  salary: string | null;

  /**
   * Free-form location used for geocoding when coordinates are missing.
   */
  locationText: string | null;

  /**
   * Town, when the source gives one.
   */
  city: string | null;

  /**
   * Postal code, when the source gives one.
   */
  postalCode: string | null;

  /**
   * Latitude, when the source gives coordinates.
   */
  latitude: number | null;

  /**
   * Longitude, when the source gives coordinates.
   */
  longitude: number | null;

  /**
   * True when the source itself flags the offer as fully remote.
   */
  isRemote: boolean;

  /**
   * True when the source only knows the department: the commute filter is skipped, the UI says so.
   */
  isLocationApproximate: boolean;

  /**
   * Link to the original ad.
   */
  url: string;

  /**
   * Publication date on the source.
   */
  publishedAt: Date | null;
}
