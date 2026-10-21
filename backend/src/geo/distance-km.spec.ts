import { describe, expect, it } from 'vitest';

import { distanceKm } from './distance-km.js';

/**
 * Le Havre town hall, the reference of the known distances below.
 */
const LE_HAVRE = { latitude: 49.4938, longitude: 0.1077 };

/**
 * Haversine sanity checks.
 */
describe('distanceKm', () => {
  it('returns zero for the same point', () => {
    expect(distanceKm(LE_HAVRE, LE_HAVRE)).toBeLessThan(0.1);
  });

  it('matches known distances', () => {
    expect(distanceKm(LE_HAVRE, { latitude: 49.4432, longitude: 1.0999 })).toBeCloseTo(72, -1);
    expect(distanceKm(LE_HAVRE, { latitude: 48.8566, longitude: 2.3522 })).toBeCloseTo(177, -1);
  });
});
