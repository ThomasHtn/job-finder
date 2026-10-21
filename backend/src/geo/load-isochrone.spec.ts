import { describe, expect, it } from 'vitest';

import { loadIsochrone } from './load-isochrone.js';

/**
 * The committed isochrone, whatever area it was generated for.
 */
describe('loadIsochrone', () => {
  it('loads the committed file as one polygon', () => {
    expect(loadIsochrone()?.geometry.type).toMatch(/Polygon$/);
  });
});
