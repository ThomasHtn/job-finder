import { describe, expect, it } from 'vitest';
import { distanceKm } from './distance-km.js';
import { isWithinArea } from './is-within-area.js';
import { loadIsochrone } from './load-isochrone.js';

/**
 * Centre of the reference area.
 */
const LE_HAVRE = { latitude: 49.4938, longitude: 0.1077 };
/**
 * Towns on both sides of the commuting boundary.
 */
const PLACES = {
  montivilliers: { latitude: 49.5453, longitude: 0.1897 },
  bolbec: { latitude: 49.5747, longitude: 0.4767 },
  fecamp: { latitude: 49.758, longitude: 0.3747 },
  honfleur: { latitude: 49.4194, longitude: 0.2333 },
  rouen: { latitude: 49.4432, longitude: 1.0999 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  openSea: { latitude: 49.65, longitude: -0.3 },
};

/**
 * Haversine sanity checks.
 */
describe('distanceKm', () => {
  it('returns zero for the same point', () => {
    expect(distanceKm(LE_HAVRE, LE_HAVRE)).toBeLessThan(0.1);
  });

  it('matches known distances', () => {
    expect(distanceKm(LE_HAVRE, PLACES.rouen)).toBeCloseTo(72, -1);
    expect(distanceKm(LE_HAVRE, PLACES.paris)).toBeCloseTo(177, -1);
  });
});

/**
 * Polygon check against the shipped isochrone.
 */
describe('isWithinArea with the committed isochrone', () => {
  const area = loadIsochrone();

  it('has an isochrone to test against', () => {
    expect(area).not.toBeNull();
  });

  it('keeps towns on the commuting side', () => {
    for (const place of [
      PLACES.montivilliers,
      PLACES.bolbec,
      PLACES.fecamp,
      PLACES.honfleur,
    ]) {
      expect(isWithinArea(area, LE_HAVRE, place)).toBe(true);
    }
  });

  it('rejects Rouen, Paris and the open sea', () => {
    for (const place of [PLACES.rouen, PLACES.paris, PLACES.openSea]) {
      expect(isWithinArea(area, LE_HAVRE, place)).toBe(false);
    }
  });
});

/**
 * Radius fallback.
 */
describe('isWithinArea without an isochrone', () => {
  it('falls back to a radius around the centre', () => {
    expect(isWithinArea(null, LE_HAVRE, PLACES.bolbec)).toBe(true);
    expect(isWithinArea(null, LE_HAVRE, PLACES.rouen)).toBe(false);
  });
});
