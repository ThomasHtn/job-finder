import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { FALLBACK_RADIUS_KM } from './commuting-area.constants.js';
import { distanceKm } from './distance-km.js';
import type { Area, Coordinates } from './geo.types.js';

/**
 * Point-in-polygon when the isochrone exists, radius around the centre otherwise.
 */
export function isWithinArea(
  area: Area | null,
  center: Coordinates,
  point: Coordinates,
): boolean {
  if (area)
    return booleanPointInPolygon([point.longitude, point.latitude], area);
  return distanceKm(center, point) <= FALLBACK_RADIUS_KM;
}
