import { Injectable, Logger } from '@nestjs/common';
import type { Coordinates } from './commuting-area.js';

/**
 * Public endpoint of the French national address base (BAN).
 */
const GEOCODER_URL = 'https://data.geopf.fr/geocodage/search';

/**
 * Below this the BAN match is too loose to be trusted (wrong town, partial street).
 */
const MIN_SCORE = 0.4;

/**
 * Time given to the geocoder before the query counts as a miss.
 */
const TIMEOUT_MS = 10_000;

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

/**
 * Turns the first BAN feature into a location, or null when it is missing or too weak.
 */
export function parseBanResponse(body: {
  features?: BanFeature[];
}): ResolvedLocation | null {
  const feature = body.features?.[0];
  if (!feature || feature.properties.score < MIN_SCORE) return null;

  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    latitude,
    longitude,
    city: feature.properties.city ?? null,
    postalCode: feature.properties.postcode ?? null,
  };
}

/**
 * HTTP client for the French national address base. Never throws: a failure is a miss.
 */
@Injectable()
export class BanGeocoder {
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(BanGeocoder.name);

  /**
   * Resolves a free-form French location to its best match.
   */
  async resolve(query: string): Promise<ResolvedLocation | null> {
    const url = `${GEOCODER_URL}?q=${encodeURIComponent(query)}&limit=1`;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Geocoder returned ${response.status} for "${query}"`);
        return null;
      }
      return parseBanResponse(
        (await response.json()) as { features?: BanFeature[] },
      );
    } catch (error) {
      this.logger.warn(
        `Geocoding failed for "${query}": ${(error as Error).message}`,
      );
      return null;
    }
  }
}
