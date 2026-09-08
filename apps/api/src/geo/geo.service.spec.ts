import { describe, expect, it, vi } from 'vitest';
import type { SearchProfile } from '../config/search-profile.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { BanGeocoder } from './ban-geocoder.js';
import { GeoService } from './geo.service.js';

/**
 * Only the centre matters to these specs.
 */
const PROFILE = {
  area: { center: { latitude: 49.4938, longitude: 0.1077 } },
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
  const service = new GeoService(
    prisma as unknown as PrismaService,
    geocoder as unknown as BanGeocoder,
    PROFILE,
  );
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
});
