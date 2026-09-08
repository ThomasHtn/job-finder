/**
 * The fields read from one Ashby job.
 */
export interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  publishedAt?: string;
  jobUrl: string;
  descriptionPlain?: string;
  employmentType?: string;
  isRemote?: boolean | null;
  workplaceType?: string | null;
  address?: {
    postalAddress?: {
      addressCountry?: string;
      addressLocality?: string;
      postalCode?: string;
    };
  };
}
