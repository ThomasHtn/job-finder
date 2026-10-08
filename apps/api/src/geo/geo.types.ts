import type { Feature, MultiPolygon, Polygon } from 'geojson';

/**
 * A point in decimal degrees.
 */
export interface Coordinates {
  /**
   * Degrees north of the equator, negative to the south.
   */
  latitude: number;

  /**
   * Degrees east of Greenwich, negative to the west.
   */
  longitude: number;
}

/**
 * The commuting area as a GeoJSON feature.
 */
export type Area = Feature<Polygon | MultiPolygon>;
