import { describe, expect, it, vi } from 'vitest';

import type { SearchProfile } from '../shared/config/search-profile.js';
import type { PrismaService } from '../shared/prisma/prisma.service.js';
import { GeoService } from './geo.service.js';

/**
 * Only the area matters to these specs.
 */
const PROFILE = {
  area: { center: { latitude: 49.4938, longitude: 0.1077 }, driveKm: 100 },
} as SearchProfile;

/**
 * A successful geocoding result.
 */
const HIT = { latitude: 49.5, longitude: 0.1, city: 'Le Havre', postalCode: '76600' };

/**
 * Service wired with a Prisma stub and a geocoder stub.
 */
function build(cached: unknown = null, resolved = HIT) {
  const prisma = {
    geocodeCache: {
      findUnique: vi.fn(async () => cached),
      create: vi.fn(async () => ({})),
    },
  };
  const geocoder = { resolve: vi.fn(async () => resolved) };
  const service = new GeoService(prisma as unknown as PrismaService, geocoder, PROFILE);
  return { service, prisma, geocoder };
}

/**
 * Cache-through geocoding.
 */
describe('GeoService.geocode', () => {
  it('ignores blank queries', async () => {
    const { service, prisma } = build();
    expect(await service.geocode('  ')).toBeNull();
    expect(prisma.geocodeCache.findUnique).not.toHaveBeenCalled();
  });

  it('normalises the query and serves a cached hit without calling the geocoder', async () => {
    const { service, prisma, geocoder } = build({ ...HIT, query: 'le havre' });
    expect(await service.geocode('  Le Havre ')).toEqual(HIT);
    expect(prisma.geocodeCache.findUnique).toHaveBeenCalledWith({
      where: { query: 'le havre' },
    });
    expect(geocoder.resolve).not.toHaveBeenCalled();
  });

  it('serves a cached miss as null', async () => {
    const { service, geocoder } = build({ latitude: null, longitude: null });
    expect(await service.geocode('nulle part')).toBeNull();
    expect(geocoder.resolve).not.toHaveBeenCalled();
  });

  it('caches a fresh hit', async () => {
    const { service, prisma } = build();
    expect(await service.geocode('Le Havre')).toEqual(HIT);
    expect(prisma.geocodeCache.create).toHaveBeenCalledWith({
      data: { query: 'le havre', ...HIT },
    });
  });

  it('caches a fresh miss with null coordinates', async () => {
    const { service, prisma } = build(null, null as never);
    expect(await service.geocode('Nulle part')).toBeNull();
    expect(prisma.geocodeCache.create).toHaveBeenCalledWith({
      data: {
        query: 'nulle part',
        latitude: null,
        longitude: null,
        city: null,
        postalCode: null,
      },
    });
  });

  it('answers a failed lookup with null and never caches it', async () => {
    const { service, prisma, geocoder } = build();
    geocoder.resolve.mockRejectedValueOnce(new Error('Geocoder returned 503'));
    expect(await service.geocode('Rouen')).toBeNull();
    expect(prisma.geocodeCache.create).not.toHaveBeenCalled();
  });
});
