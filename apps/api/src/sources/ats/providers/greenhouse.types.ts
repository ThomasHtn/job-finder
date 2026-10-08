/**
 * The fields read from one Greenhouse job.
 */
export interface GreenhouseJob {
  /**
   * Numeric job id, unique within the board.
   */
  id: number;
  /**
   * Ad title, shown as is.
   */
  title: string;
  /**
   * Public ad page, often on the company's own careers site.
   */
  absolute_url: string;
  /**
   * Last update date, used when `first_published` is missing.
   */
  updated_at?: string;
  /**
   * First publication date, preferred over `updated_at`.
   */
  first_published?: string;
  /**
   * Full ad as entity-escaped HTML, only sent with `content=true`.
   */
  content?: string;
  /**
   * Free-text location, sometimes a list of several offices.
   */
  location?: { name?: string };
  /**
   * Custom fields set per board; read for the country and the employment type.
   */
  metadata?: { name: string; value: string | null }[];
}
