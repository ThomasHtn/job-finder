/**
 * The fields read from one Adzuna result.
 */
export interface AdzunaJob {
  id: string;
  title: string;
  description?: string;
  created?: string;
  redirect_url: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  latitude?: number;
  longitude?: number;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
}
