/**
 * The fields read from one Free-Work offer.
 */
export interface FreeWorkJob {
  id: number;
  title: string;
  slug: string;
  /**
   * HTML, and the ad is split in two: the role then the wanted profile.
   */
  description?: string | null;
  candidateProfile?: string | null;
  companyDescription?: string | null;
  /**
   * "permanent", "contractor", "fixed-term"; an offer can carry several.
   */
  contracts?: string[];
  remoteMode?: string | null;
  annualSalary?: string | null;
  publishedAt?: string | null;
  company?: { name?: string | null } | null;
  /**
   * Job family, whose slug is part of the public URL.
   */
  job?: { slug?: string | null } | null;
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
