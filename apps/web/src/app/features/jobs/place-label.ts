import type { JobDetail, JobSummary } from '@job-finder/shared';

/**
 * Shown instead of a town for a fully remote position.
 */
const REMOTE_LABEL = 'Full remote';

/**
 * Shown when the source names no place at all.
 */
const UNKNOWN_LABEL = 'Lieu non précisé';

/**
 * Feed line: "76 - LE HAVRE" like France Travail, or the closest the source allows.
 */
export function rowPlaceLabel(job: JobSummary): string {
  if (job.isRemote) return REMOTE_LABEL;
  if (!job.city) return UNKNOWN_LABEL;
  return job.postalCode ? `${job.postalCode.slice(0, 2)} - ${job.city}` : job.city;
}

/**
 * Detail page: same place, spelled out, and flagged when only the area is known.
 */
export function detailPlaceLabel(job: JobDetail): string {
  if (job.isRemote) return REMOTE_LABEL;
  if (!job.city) return UNKNOWN_LABEL;
  if (job.isLocationApproximate) return `${job.city} (commune non précisée)`;
  return job.postalCode ? `${job.city} (${job.postalCode})` : job.city;
}
