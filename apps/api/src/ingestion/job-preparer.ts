import type { SearchProfile } from '../config/search-profile.js';
import type { RawJob } from '../sources/raw-job.js';
import { detectPermanent } from './classifier/detect-permanent.js';
import { detectRemote } from './classifier/detect-remote.js';
import { isWanted } from './classifier/is-wanted.js';
import { computeDedupeHash } from './dedupe.js';
import type { GeoPort, PreparedJob } from './job-preparer.types.js';

/**
 * Applies the hard criteria. Returns null when the offer is out of scope.
 */
export async function prepareJob(
  raw: RawJob,
  profile: SearchProfile,
  geo: GeoPort,
): Promise<PreparedJob | null> {
  if (!isWanted(raw, profile)) return null;
  if (!detectPermanent(raw)) return null;

  const isRemote = detectRemote(raw);
  let { latitude, longitude, city, postalCode } = raw;

  /*
   * Remote offers are kept wherever they are. Region-only offers cannot be checked
   * against the commuting area, so they are kept and flagged rather than dropped.
   */
  if (!isRemote && !raw.isLocationApproximate) {
    if (latitude === null || longitude === null) {
      const query = raw.locationText ?? raw.city;
      const resolved = query ? await geo.geocode(query) : null;
      if (!resolved) return null;
      latitude = resolved.latitude;
      longitude = resolved.longitude;
      city ??= resolved.city;
      postalCode ??= resolved.postalCode;
    }
    if (!geo.isWithinArea({ latitude, longitude })) return null;
  }

  return {
    ...raw,
    isRemote,
    latitude,
    longitude,
    city,
    postalCode,
    dedupeHash: computeDedupeHash(
      raw.title,
      raw.company,
      isRemote ? 'remote' : city,
    ),
  };
}
