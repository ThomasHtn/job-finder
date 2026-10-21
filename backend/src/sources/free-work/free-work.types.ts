/**
 * The fields read from one Free-Work offer.
 */
export interface FreeWorkJob {
  /**
   * Numeric offer id, stringified into sourceId.
   */
  id: number;
  /**
   * Ad title, shown as is.
   */
  title: string;
  /**
   * Offer slug, last segment of the public ad URL.
   */
  slug: string;
  /**
   * HTML, and the ad is split in two: the role then the wanted profile.
   */
  description?: string | null;
  /**
   * Second half of the ad, HTML, appended to the description.
   */
  candidateProfile?: string | null;
  /**
   * Employer presentation, HTML.
   */
  companyDescription?: string | null;
  /**
   * "permanent", "contractor", "fixed-term"; an offer can carry several.
   */
  contracts?: string[];
  /**
   * Remote policy; only "full" counts as a remote offer.
   */
  remoteMode?: string | null;
  /**
   * Yearly salary as free text, shown as is.
   */
  annualSalary?: string | null;
  /**
   * Publication date, ISO 8601.
   */
  publishedAt?: string | null;
  /**
   * Employer; the name can be missing.
   */
  company?: { name?: string | null } | null;
  /**
   * Job family, whose slug is part of the public URL.
   */
  job?: { slug?: string | null } | null;
  /**
   * Place of the offer; a region-wide one has no `locality` and region-centroid coordinates.
   */
  location?: {
    locality?: string | null;
    postalCode?: string | null;
    adminLevel1?: string | null;
    adminLevel2?: string | null;
    /**
     * Decimal degrees, as strings.
     */
    latitude?: string | null;
    longitude?: string | null;
    label?: string | null;
  } | null;
}
