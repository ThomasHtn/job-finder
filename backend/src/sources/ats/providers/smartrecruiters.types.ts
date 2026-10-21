/**
 * The fields read from one SmartRecruiters posting.
 */
export interface SmartRecruitersPosting {
  /**
   * Posting id, used to fetch the description and to build the ad URL.
   */
  id: string;
  /**
   * Posting title.
   */
  name: string;
  /**
   * Publication date, ISO 8601.
   */
  releasedDate?: string;
  /**
   * Structured location; `country` is a lowercase ISO code such as "fr".
   */
  location?: {
    city?: string;
    country?: string;
    postalCode?: string;
    remote?: boolean;
  };
  /**
   * Contract kind; only the `permanent` id is trusted as a CDI.
   */
  typeOfEmployment?: { id?: string; label?: string };
}

/**
 * The description sections of one SmartRecruiters posting.
 */
export interface SmartRecruitersDetail {
  /**
   * Ad body, split into HTML sections keyed by name (jobDescription, qualifications...).
   */
  jobAd?: { sections?: Record<string, { text?: string }> };
}
