import type { Feature, MultiPolygon, Polygon } from 'geojson';

/**
 * A point in decimal degrees.
 */
export type Coordinates = { latitude: number; longitude: number };

/**
 * The commuting area as a GeoJSON feature.
 */
export type Area = Feature<Polygon | MultiPolygon>;
