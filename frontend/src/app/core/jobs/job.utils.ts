import { translate } from '@jsverse/transloco';

import type { JobDetail, JobSummary } from '@job-finder/contract';

/**
 * Feed line: "76 - LE HAVRE" like France Travail, or the closest the source allows.
 */
export function rowPlaceLabel(job: JobSummary): string {
  if (job.isRemote) {
    return translate('place.remote');
  }
  if (!job.city) {
    return translate('place.unknown');
  }
  return job.postalCode ? `${job.postalCode.slice(0, 2)} - ${job.city}` : job.city;
}

/**
 * Detail panel: same place, spelled out, and flagged when only the area is known.
 */
export function detailPlaceLabel(job: JobDetail): string {
  if (job.isRemote) {
    return translate('place.remote');
  }
  if (!job.city) {
    return translate('place.unknown');
  }
  if (job.isLocationApproximate) {
    return translate('place.approximate', { city: job.city });
  }
  return job.postalCode ? `${job.city} (${job.postalCode})` : job.city;
}

/**
 * Whether an offer first appeared after the previous visit; never on the very first one.
 */
export function isNewSince(job: JobSummary, previousVisitAt: string | null): boolean {
  return previousVisitAt !== null && job.firstSeenAt > previousVisitAt;
}
