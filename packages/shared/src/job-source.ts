/**
 * Identifiers of the job boards the API ingests from.
 */
export const JOB_SOURCES = [
  'FRANCE_TRAVAIL',
  'ADZUNA',
  'ATS',
  'EURES',
  'APEC',
  'FREE_WORK',
] as const;

/**
 * One of the known job sources.
 */
export type JobSource = (typeof JOB_SOURCES)[number];
