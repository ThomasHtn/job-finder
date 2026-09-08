import type { Coordinates } from './geo.types.js';

/**
 * Coordinates plus the town they resolve to.
 */
export interface ResolvedLocation extends Coordinates {
  /**
   * Town name from the address base.
   */
  city: string | null;

  /**
   * Postal code from the address base.
   */
  postalCode: string | null;
}

/**
 * The parts of a BAN GeoJSON feature that are read.
 */
export interface BanFeature {
  /**
   * GeoJSON order: [longitude, latitude].
   */
  geometry: { coordinates: [number, number] };

  /**
   * Match quality and the resolved town.
   */
  properties: { score: number; city?: string; postcode?: string };
}
