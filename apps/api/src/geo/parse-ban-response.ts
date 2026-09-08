import { MIN_SCORE } from './ban-geocoder.constants.js';
import type { BanFeature, ResolvedLocation } from './ban-geocoder.types.js';

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
