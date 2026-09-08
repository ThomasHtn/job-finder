import type { JobDetail, JobSummary } from '@job-finder/shared';
import type { Translations } from '../../core/i18n/translations';

/**
 * Feed line: "76 - LE HAVRE" like France Travail, or the closest the source allows.
 */
export function rowPlaceLabel(job: JobSummary, text: Translations): string {
  if (job.isRemote) return text.place.remote;
  if (!job.city) return text.place.unknown;
  return job.postalCode ? `${job.postalCode.slice(0, 2)} - ${job.city}` : job.city;
}

/**
 * Detail page: same place, spelled out, and flagged when only the area is known.
 */
export function detailPlaceLabel(job: JobDetail, text: Translations): string {
  if (job.isRemote) return text.place.remote;
  if (!job.city) return text.place.unknown;
  if (job.isLocationApproximate) return text.place.approximate(job.city);
  return job.postalCode ? `${job.city} (${job.postalCode})` : job.city;
}
