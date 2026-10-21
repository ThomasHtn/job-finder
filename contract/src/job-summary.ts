import type { JobSource } from './job-source.js';

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
