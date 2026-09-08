/**
 * The fields read from one SmartRecruiters posting.
 */
export interface SmartRecruitersPosting {
  id: string;
  name: string;
  releasedDate?: string;
  location?: {
    city?: string;
    country?: string;
    postalCode?: string;
    remote?: boolean;
  };
  typeOfEmployment?: { id?: string; label?: string };
}

/**
 * The description sections of one SmartRecruiters posting.
 */
export interface SmartRecruitersDetail {
  jobAd?: { sections?: Record<string, { text?: string }> };
}
