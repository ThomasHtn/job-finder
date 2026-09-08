import { describe, expect, it } from 'vitest';
import { distanceKm } from './distance-km.js';
import { isWithinArea } from './is-within-area.js';
import { loadIsochrone } from './load-isochrone.js';

/**
 * Centre of the reference area, and the drive it is configured for.
 */
const LE_HAVRE = { latitude: 49.4938, longitude: 0.1077 };
const DRIVE_KM = 100;

/**
 * Towns on both sides of the shipped boundary, which follows 100 km of road from the centre
 * (`SEARCH_AREA_DRIVE_KM`).
 */
const PLACES = {
  montivilliers: { latitude: 49.5453, longitude: 0.1897 },
  bolbec: { latitude: 49.5747, longitude: 0.4767 },
  fecamp: { latitude: 49.758, longitude: 0.3747 },
  honfleur: { latitude: 49.4194, longitude: 0.2333 },
  caen: { latitude: 49.1829, longitude: -0.3707 },
  rouen: { latitude: 49.4432, longitude: 1.0999 },
  dieppe: { latitude: 49.9229, longitude: 1.0774 },
  evreux: { latitude: 49.027, longitude: 1.1508 },
  amiens: { latitude: 49.8941, longitude: 2.2958 },
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

  it('keeps the towns within a 100 km drive', () => {
    for (const place of [
      PLACES.montivilliers,
      PLACES.bolbec,
      PLACES.fecamp,
      PLACES.honfleur,
      PLACES.caen,
      PLACES.rouen,
      PLACES.dieppe,
    ]) {
      expect(isWithinArea(area, LE_HAVRE, place, DRIVE_KM)).toBe(true);
    }
  });

  it('drops what the roads put out of reach, however close it looks', () => {
    /* Évreux fits in a 100 km circle and not in 100 km of road: the estuary sends the drive
       round by Tancarville. The sea point is 34 km out and reachable by no road at all. */
    for (const place of [
      PLACES.evreux,
      PLACES.amiens,
      PLACES.paris,
      PLACES.openSea,
    ]) {
      expect(isWithinArea(area, LE_HAVRE, place, DRIVE_KM)).toBe(false);
    }
  });

  it('measures the road rather than the crow flight', () => {
    /* Évreux is inside the circle a radius would draw, and outside the drive. */
    expect(distanceKm(LE_HAVRE, PLACES.evreux)).toBeLessThan(DRIVE_KM);
    expect(isWithinArea(area, LE_HAVRE, PLACES.evreux, DRIVE_KM)).toBe(false);
  });
});

/**
 * Radius fallback, used only while the isochrone file is missing.
 */
describe('isWithinArea without an isochrone', () => {
  it('falls back to the configured drive as a radius around the centre', () => {
    for (const place of [
      PLACES.bolbec,
      PLACES.caen,
      PLACES.rouen,
      PLACES.dieppe,
    ]) {
      expect(isWithinArea(null, LE_HAVRE, place, DRIVE_KM)).toBe(true);
    }
    for (const place of [PLACES.amiens, PLACES.paris]) {
      expect(isWithinArea(null, LE_HAVRE, place, DRIVE_KM)).toBe(false);
    }
  });

  it('keeps more than the roads would, never less', () => {
    /* Évreux is out of a 100 km drive and inside a 100 km circle: the straight line cannot
       know about the estuary. Better shown too far than never shown at all. */
    expect(isWithinArea(null, LE_HAVRE, PLACES.evreux, DRIVE_KM)).toBe(true);
  });
});
