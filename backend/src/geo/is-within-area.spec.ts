import { describe, expect, it } from 'vitest';

import type { Area } from './geo.types.js';
import { isWithinArea } from './is-within-area.js';

/**
 * Centre of the fixture area, on the equator so a degree stays close to 111 km both ways.
 */
const CENTER = { latitude: 0, longitude: 0 };

/**
 * Radius of the fallback, as the configured drive would give it.
 */
const DRIVE_KM = 100;

/**
 * A square with a notch cut into its east side, like an estuary the roads go round.
 */
const AREA: Area = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-1, -1],
        [1, -1],
        [1, -0.2],
        [0.2, -0.2],
        [0.2, 0.2],
        [1, 0.2],
        [1, 1],
        [-1, 1],
        [-1, -1],
      ],
    ],
  },
};

/**
 * Points on both sides of the fixture boundary.
 */
const PLACES = {
  inside: { latitude: 0.5, longitude: 0.5 },
  inTheNotch: { latitude: 0, longitude: 0.5 },
  farAway: { latitude: 2, longitude: 0 },
};

/**
 * Polygon check, used whenever the isochrone exists.
 */
describe('isWithinArea with an isochrone', () => {
  it('keeps a point inside the polygon', () => {
    expect(isWithinArea(AREA, CENTER, PLACES.inside, DRIVE_KM)).toBe(true);
  });

  it('drops a point the roads do not reach, however close it looks', () => {
    expect(isWithinArea(AREA, CENTER, PLACES.inTheNotch, DRIVE_KM)).toBe(false);
  });
});

/**
 * Radius fallback, used only while the isochrone file is missing.
 */
describe('isWithinArea without an isochrone', () => {
  it('falls back to the configured drive as a radius around the centre', () => {
    expect(isWithinArea(null, CENTER, PLACES.inside, DRIVE_KM)).toBe(true);
    expect(isWithinArea(null, CENTER, PLACES.farAway, DRIVE_KM)).toBe(false);
  });

  it('keeps more than the roads would, never less', () => {
    expect(isWithinArea(null, CENTER, PLACES.inTheNotch, DRIVE_KM)).toBe(true);
  });
});
