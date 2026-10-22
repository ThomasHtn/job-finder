import { describe, expect, it } from 'vitest';

import { parseIsochroneResponse } from './parse-isochrone-response.js';

/**
 * A closed square ring around Le Havre.
 */
const RING = [
  [0, 49],
  [1, 49],
  [1, 50],
  [0, 49],
];

/**
 * Validation of the OpenRouteService payload.
 */
describe('parseIsochroneResponse', () => {
  it('keeps only the polygon rings', () => {
    expect(
      parseIsochroneResponse({
        type: 'FeatureCollection',
        bbox: [0, 49, 1, 50],
        features: [
          {
            type: 'Feature',
            properties: { value: 1 },
            geometry: { type: 'Polygon', coordinates: [RING] },
          },
        ],
      }),
    ).toEqual({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [RING] },
    });
  });

  it('rejects an empty answer', () => {
    expect(() => parseIsochroneResponse({ features: [] })).toThrow();
  });

  it('rejects coordinates out of range', () => {
    const ring = [
      [0, 49],
      [1, 49],
      [1, 120],
      [0, 49],
    ];
    expect(() =>
      parseIsochroneResponse({
        features: [{ geometry: { type: 'Polygon', coordinates: [ring] } }],
      }),
    ).toThrow();
  });
});
