/**
 * The fields read from one Greenhouse job.
 */
export interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
  content?: string;
  location?: { name?: string };
  metadata?: { name: string; value: string | null }[];
}
