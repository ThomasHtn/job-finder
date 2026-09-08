import type { ResolvedLocation } from '../geo/ban-geocoder.types.js';
import type { Coordinates } from '../geo/geo.types.js';
import type { RawJob } from '../sources/raw-job.js';

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
