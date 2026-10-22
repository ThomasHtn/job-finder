import { describe, expect, it, vi } from 'vitest';

import { PROFILE } from '../shared/config/search-profile.fixtures.js';
import { rawJob } from '../sources/raw-job.fixtures.js';
import type { GeoPort } from './ingestion.types.js';
import { prepareJob } from './job-preparer.js';

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
  it('keeps a matching offer inside the area, computes its dedupe hash and drops its coordinates', async () => {
    const prepared = await prepareJob(rawJob(), PROFILE, geo());
    expect(prepared).not.toBeNull();
    expect(prepared?.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
    expect(prepared?.isRemote).toBe(false);
    expect(prepared).not.toHaveProperty('latitude');
  });

  it('strips the NUL characters PostgreSQL rejects from every field', async () => {
    const prepared = await prepareJob(
      rawJob({ description: 'Angular\u0000 et Java', company: 'Ac\u0000me' }),
      PROFILE,
      geo(),
    );

    expect(prepared).toMatchObject({ description: 'Angular et Java', company: 'Acme' });
  });

  it('hashes every remote offer on the same place', async () => {
    const remote = await prepareJob(rawJob({ isRemote: true, city: 'Paris' }), PROFILE, geo());
    const elsewhere = await prepareJob(rawJob({ isRemote: true, city: 'Lyon' }), PROFILE, geo());

    expect(remote?.dedupeHash).toBe(elsewhere?.dedupeHash);
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
    const out = await prepareJob(rawJob(), PROFILE, geo({ isWithinArea: () => false }));
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
    expect(g.isWithinArea).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 49.5, longitude: 0.1 }),
    );
    expect(out).toMatchObject({
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
