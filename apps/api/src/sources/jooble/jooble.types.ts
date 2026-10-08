/**
 * The fields read from one Jooble result. `id` is skipped: a 64-bit integer that JSON.parse rounds.
 */
export interface JoobleJob {
  /**
   * Ad title, may carry HTML markup around the matched keywords.
   */
  title: string;
  /**
   * Place as free text, can be an empty string.
   */
  location?: string;
  /**
   * Short HTML excerpt of the ad, never the full text.
   */
  snippet?: string;
  /**
   * Salary as free text, can be an empty string.
   */
  salary?: string;
  /**
   * Board the offer was aggregated from, shown in the source label.
   */
  source?: string;
  /**
   * Contract label as free text, fed to the permanent-contract detection.
   */
  type?: string;
  /**
   * Jooble redirect to the ad; its `/jdp/<id>` segment gives the exact offer id.
   */
  link: string;
  /**
   * Employer name, can be an empty string.
   */
  company?: string;
  /**
   * Last update date, used as the publication date.
   */
  updated?: string;
}
