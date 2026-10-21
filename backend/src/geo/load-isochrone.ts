import { readFileSync } from 'node:fs';

import type { FeatureCollection } from 'geojson';

import { ISOCHRONE_FILENAME } from './geo.constants.js';
import type { Area } from './geo.types.js';

/**
 * Returns null when the file has not been generated yet. A file that exists but does not parse
 * throws: a broken isochrone is a bug to fix, never a reason to widen the area silently.
 */
export function loadIsochrone(): Area | null {
  const url = new URL(`./${ISOCHRONE_FILENAME}`, import.meta.url);
  let text: string;
  try {
    text = readFileSync(url, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const parsed = JSON.parse(text) as FeatureCollection | Area;
  return parsed.type === 'FeatureCollection' ? ((parsed.features[0] as Area) ?? null) : parsed;
}
