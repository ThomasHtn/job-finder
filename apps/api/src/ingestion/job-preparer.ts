import type { SearchProfile } from '../config/search-profile.js';
import type { Coordinates } from '../geo/commuting-area.js';
import type { ResolvedLocation } from '../geo/ban-geocoder.js';
import type { RawJob } from '../sources/source.types.js';
import { detectPermanent, detectRemote, isWanted } from './classifier.js';
import { computeDedupeHash } from './dedupe.js';

/**
 * A raw offer that passed the filters, with its similarity key computed.
 */
export type PreparedJob = RawJob & { dedupeHash: string };

/**
 * The slice of GeoService the pipeline needs, so tests can fake it.
 */
export interface GeoPort {
  /**
   * Free-form location to coordinates, null when unknown.
   */
  geocode(query: string): Promise<ResolvedLocation | null>;

  /**
   * True when the point is inside the commuting area.
   */
  isWithinArea(point: Coordinates): boolean;
}

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
