/**
 * The fields read from one result of Capgemini's job search API.
 */
export interface CapgeminiJob {
  id: string;
  title: string;
  brand?: string;
  contract_type?: string;
  description?: string;
  location?: string;
  apply_job_url: string;
  updated_at?: string;
}
