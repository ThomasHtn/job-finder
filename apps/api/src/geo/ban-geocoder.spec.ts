import { describe, expect, it } from 'vitest';
import { parseBanResponse } from './parse-ban-response.js';

/**
 * Mapping of the BAN payload.
 */
describe('parseBanResponse', () => {
  it('maps the first feature, swapping lon/lat into lat/lng', () => {
    expect(
      parseBanResponse({
        features: [
          {
            geometry: { coordinates: [0.1077, 49.4938] },
            properties: { score: 0.9, city: 'Le Havre', postcode: '76600' },
          },
        ],
      }),
    ).toEqual({
      latitude: 49.4938,
      longitude: 0.1077,
      city: 'Le Havre',
      postalCode: '76600',
    });
  });

  it('rejects weak matches', () => {
    expect(
      parseBanResponse({
        features: [
          { geometry: { coordinates: [0, 0] }, properties: { score: 0.2 } },
        ],
      }),
    ).toBeNull();
  });

  it('returns null on an empty result', () => {
    expect(parseBanResponse({})).toBeNull();
    expect(parseBanResponse({ features: [] })).toBeNull();
  });
});
