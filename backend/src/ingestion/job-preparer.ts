import type { SearchProfile } from '../shared/config/search-profile.types.js';
import { detectPermanent } from '../sources/classifier/detect-permanent.js';
import { detectRemote } from '../sources/classifier/detect-remote.js';
import { isWanted } from '../sources/classifier/is-wanted.js';
import type { RawJob } from '../sources/raw-job.js';
import { computeDedupeHash } from './dedupe.js';
import { dedupePlace } from './dedupe-place.js';
import type { GeoPort, PreparedJob } from './ingestion.types.js';
import { sanitizeJob } from './sanitize-job.js';

/**
 * Cleans the offer, then applies the hard criteria. Returns null when it is out of scope.
 */
export async function prepareJob(
  incoming: RawJob,
  profile: SearchProfile,
  geo: GeoPort,
): Promise<PreparedJob | null> {
  const raw = sanitizeJob(incoming);
  if (!isWanted(raw, profile)) return null;
  if (!detectPermanent(raw)) return null;

  const isRemote = detectRemote(raw);
  const { latitude, longitude, ...offer } = raw;
  let { city, postalCode } = offer;

  /*
   * Remote offers are kept wherever they are. Region-only offers cannot be checked
   * against the commuting area, so they are kept and flagged rather than dropped.
   */
  if (!isRemote && !raw.isLocationApproximate) {
    let point = latitude === null || longitude === null ? null : { latitude, longitude };
    if (!point) {
      const query = raw.locationText ?? raw.city;
      const resolved = query ? await geo.geocode(query) : null;
      if (!resolved) return null;
      point = resolved;
      city ??= resolved.city;
      postalCode ??= resolved.postalCode;
    }
    if (!geo.isWithinArea(point)) return null;
  }

  return {
    ...offer,
    isRemote,
    city,
    postalCode,
    dedupeHash: computeDedupeHash(raw.title, raw.company, dedupePlace(isRemote, city)),
  };
}
