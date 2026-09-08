import { readFileSync } from 'node:fs';
import type { FeatureCollection } from 'geojson';
import { ISOCHRONE_FILENAME } from './commuting-area.constants.js';
import type { Area } from './geo.types.js';

/**
 * Returns null when the file has not been generated yet.
 */
export function loadIsochrone(): Area | null {
  try {
    const url = new URL(`./${ISOCHRONE_FILENAME}`, import.meta.url);
    const parsed = JSON.parse(readFileSync(url, 'utf8')) as
      | FeatureCollection
      | Area;
    return parsed.type === 'FeatureCollection'
      ? ((parsed.features[0] as Area) ?? null)
      : parsed;
  } catch {
    return null;
  }
}
