import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { distanceKm } from './distance-km.js';
import type { Area, Coordinates } from './geo.types.js';

/**
 * Point-in-polygon when the isochrone exists, radius around the centre otherwise. As a
 * straight line, the same figure covers more ground than the road does: while the isochrone
 * is missing, showing an offer slightly too far beats never seeing a reachable one.
 */
export function isWithinArea(
  area: Area | null,
  center: Coordinates,
  point: Coordinates,
  fallbackRadiusKm: number,
): boolean {
  if (area)
    return booleanPointInPolygon([point.longitude, point.latitude], area);
  return distanceKm(center, point) <= fallbackRadiusKm;
}
