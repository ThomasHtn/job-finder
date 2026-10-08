/**
 * The fields read from one EURES vacancy.
 */
export interface EuresJob {
  /**
   * Vacancy id, used as sourceId and in the detail page URL.
   */
  id: string;
  /**
   * Ad title, shown as is.
   */
  title: string;
  /**
   * Full ad as HTML.
   */
  description?: string;
  /**
   * Publication date, as epoch milliseconds.
   */
  creationDate?: number;
  /**
   * Kind of position, e.g. `directhire`; only a direct hire can be permanent.
   */
  positionOfferingCode?: string;
  /**
   * Employer, whose name can be null on an anonymous vacancy.
   */
  employer?: { name?: string | null };
}
