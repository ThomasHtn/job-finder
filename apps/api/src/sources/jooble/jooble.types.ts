/**
 * The fields read from one Jooble result. `id` is skipped: a 64-bit integer that JSON.parse rounds.
 */
export interface JoobleJob {
  title: string;
  location?: string;
  snippet?: string;
  salary?: string;
  source?: string;
  type?: string;
  link: string;
  company?: string;
  updated?: string;
}
