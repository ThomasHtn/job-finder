/**
 * The fields read from one result of Capgemini's job search API.
 */
export interface CapgeminiJob {
  /**
   * Offer id, unique across the whole group.
   */
  id: string;
  /**
   * Ad title, shown as is.
   */
  title: string;
  /**
   * Group entity hiring (e.g. Capgemini Engineering), used as the company.
   */
  brand?: string;
  /**
   * Contract label as free text, fed to the permanent-contract detection.
   */
  contract_type?: string;
  /**
   * Full ad as HTML.
   */
  description?: string;
  /**
   * Free-text list of towns; the ad is kept when it names the board's town.
   */
  location?: string;
  /**
   * Public ad page with the apply button.
   */
  apply_job_url: string;
  /**
   * Last update date, used as the publication date.
   */
  updated_at?: string;
}
