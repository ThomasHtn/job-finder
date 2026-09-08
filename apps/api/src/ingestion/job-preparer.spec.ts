import { describe, expect, it, vi } from 'vitest';
import { prepareJob } from './job-preparer.js';
import type { GeoPort } from './job-preparer.types.js';
import { PROFILE, rawJob } from './test-fixtures.js';

/**
 * Geo stub, permissive by default.
 */
function geo(overrides: Partial<GeoPort> = {}): GeoPort {
  return {
    geocode: vi.fn(async () => null),
    isWithinArea: vi.fn(() => true),
    ...overrides,
  };
}

/**
 * Hard filters and enrichment applied to every raw offer.
 */
describe('prepareJob', () => {
  it('keeps a matching offer inside the area and computes its dedupe hash', async () => {
    const prepared = await prepareJob(rawJob(), PROFILE, geo());
    expect(prepared).not.toBeNull();
    expect(prepared?.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
    expect(prepared?.isRemote).toBe(false);
  });

  it('drops offers that do not match the profile', async () => {
    const out = await prepareJob(
      rawJob({ title: 'Comptable', description: 'Excel' }),
      PROFILE,
      geo(),
    );
    expect(out).toBeNull();
  });

  it('drops non-permanent offers', async () => {
    const out = await prepareJob(
      rawJob({ isPermanent: false, contractLabel: 'CDD' }),
      PROFILE,
      geo(),
    );
    expect(out).toBeNull();
  });

  it('drops offers outside the commuting area', async () => {
    const out = await prepareJob(
      rawJob(),
      PROFILE,
      geo({ isWithinArea: () => false }),
    );
    expect(out).toBeNull();
  });

  it('keeps remote offers without checking the area', async () => {
    const g = geo({ isWithinArea: vi.fn(() => false) });
    const out = await prepareJob(
      rawJob({ description: 'Angular, full remote', latitude: null, longitude: null }),
      PROFILE,
      g,
    );
    expect(out?.isRemote).toBe(true);
    expect(g.isWithinArea).not.toHaveBeenCalled();
    expect(g.geocode).not.toHaveBeenCalled();
  });

  it('keeps region-only offers without geocoding them', async () => {
    const g = geo();
    const out = await prepareJob(
      rawJob({ isLocationApproximate: true, latitude: null, longitude: null }),
      PROFILE,
      g,
    );
    expect(out).not.toBeNull();
    expect(g.geocode).not.toHaveBeenCalled();
  });

  it('geocodes missing coordinates and fills city and postal code', async () => {
    const g = geo({
      geocode: vi.fn(async () => ({
        latitude: 49.5,
        longitude: 0.1,
        city: 'Montivilliers',
        postalCode: '76290',
      })),
    });
    const out = await prepareJob(
      rawJob({
        latitude: null,
        longitude: null,
        city: null,
        postalCode: null,
        locationText: 'Montivilliers (76)',
      }),
      PROFILE,
      g,
    );
    expect(g.geocode).toHaveBeenCalledWith('Montivilliers (76)');
    expect(out).toMatchObject({
      latitude: 49.5,
      longitude: 0.1,
      city: 'Montivilliers',
      postalCode: '76290',
    });
  });

  it('drops offers whose location cannot be geocoded', async () => {
    const out = await prepareJob(
      rawJob({ latitude: null, longitude: null, locationText: 'Nulle part' }),
      PROFILE,
      geo(),
    );
    expect(out).toBeNull();
  });

  it('uses "remote" instead of the city in the dedupe hash of remote offers', async () => {
    const onSite = await prepareJob(rawJob(), PROFILE, geo());
    const remote = await prepareJob(
      rawJob({ description: 'Angular, full remote' }),
      PROFILE,
      geo(),
    );
    expect(onSite?.dedupeHash).not.toBe(remote?.dedupeHash);
  });
});
