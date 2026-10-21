/**
 * The fields read from one Ashby job.
 */
export interface AshbyJob {
  /**
   * Job id, unique within the board.
   */
  id: string;
  /**
   * Ad title, shown as is.
   */
  title: string;
  /**
   * Primary location as free text, the fallback when no address is given.
   */
  location?: string;
  /**
   * Publication date, ISO 8601.
   */
  publishedAt?: string;
  /**
   * Public ad page on the board.
   */
  jobUrl: string;
  /**
   * Full ad as plain text.
   */
  descriptionPlain?: string;
  /**
   * "FullTime", "Contract", "Intern"...; fed to the permanent-contract detection.
   */
  employmentType?: string;
  /**
   * Remote flag, null when the board does not say.
   */
  isRemote?: boolean | null;
  /**
   * "OnSite", "Hybrid" or "Remote".
   */
  workplaceType?: string | null;
  /**
   * Structured address, whose country decides whether the job is in France.
   */
  address?: {
    postalAddress?: {
      addressCountry?: string;
      addressLocality?: string;
      postalCode?: string;
    };
  };
}
