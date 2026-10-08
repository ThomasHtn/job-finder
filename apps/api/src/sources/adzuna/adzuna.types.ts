/**
 * The fields read from one Adzuna result.
 */
export interface AdzunaJob {
  /**
   * Adzuna's offer id, used as sourceId and to merge the local and remote passes.
   */
  id: string;
  /**
   * Ad title, shown as is.
   */
  title: string;
  /**
   * Truncated snippet of the ad, never the full text.
   */
  description?: string;
  /**
   * Publication date, ISO 8601.
   */
  created?: string;
  /**
   * Adzuna redirect to the original ad, the only link the API gives.
   */
  redirect_url: string;
  /**
   * Employer, when the ad names one.
   */
  company?: { display_name?: string };
  /**
   * Display label, plus the area hierarchy from country down to the town.
   */
  location?: { display_name?: string; area?: string[] };
  /**
   * Decimal degrees, when Adzuna could locate the offer.
   */
  latitude?: number;
  /**
   * Decimal degrees, when Adzuna could locate the offer.
   */
  longitude?: number;
  /**
   * Lower bound of the yearly salary range, in euros.
   */
  salary_min?: number;
  /**
   * Upper bound of the yearly salary range, in euros.
   */
  salary_max?: number;
  /**
   * "permanent" or "contract"; output only, the search filters with `permanent=1`.
   */
  contract_type?: string;
}
