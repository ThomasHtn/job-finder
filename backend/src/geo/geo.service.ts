import { Inject, Injectable, Logger } from '@nestjs/common';

import { SEARCH_PROFILE, type SearchProfile } from '../shared/config/search-profile.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { BanGeocoder } from './ban-geocoder.js';
import type { ResolvedLocation } from './ban-geocoder.types.js';
import type { Area, Coordinates } from './geo.types.js';
import { isWithinArea } from './is-within-area.js';
import { loadIsochrone } from './load-isochrone.js';

/**
 * Facade over the isochrone check and the geocoder, with a database cache in front.
 */
@Injectable()
export class GeoService {
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(GeoService.name);

  /**
   * Isochrone loaded once at construction; null falls back to a radius.
   */
  private readonly area: Area | null = loadIsochrone();

  /**
   * Warns at boot when the isochrone is missing, so the fallback is never silent.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoder: BanGeocoder,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {
    if (!this.area) {
      this.logger.warn(
        'No isochrone found, falling back to a straight-line radius. Run `npm run geo:isochrone` with ORS_API_KEY set.',
      );
    }
  }

  /**
   * True when the point is inside the commuting area. Without an isochrone, the configured
   * drive doubles as the radius, so the fallback answers for the area actually asked for.
   */
  public isWithinArea(point: Coordinates): boolean {
    const { center, driveKm } = this.profile.area;
    return isWithinArea(this.area, center, point, driveKm);
  }

  /**
   * Geocodes a free-form French location, caching both hits and misses. A failed lookup answers
   * null without being cached, so the next run asks again.
   */
  public async geocode(rawQuery: string): Promise<ResolvedLocation | null> {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return null;

    const cached = await this.prisma.geocodeCache.findUnique({
      where: { query },
    });
    if (cached) {
      return cached.latitude === null || cached.longitude === null
        ? null
        : {
            latitude: cached.latitude,
            longitude: cached.longitude,
            city: cached.city,
            postalCode: cached.postalCode,
          };
    }

    let resolved: ResolvedLocation | null;
    try {
      resolved = await this.geocoder.resolve(query);
    } catch (error) {
      this.logger.warn(`Geocoding failed for "${query}", not cached: ${(error as Error).message}`);
      return null;
    }
    await this.prisma.geocodeCache.create({
      data: {
        query,
        latitude: resolved?.latitude ?? null,
        longitude: resolved?.longitude ?? null,
        city: resolved?.city ?? null,
        postalCode: resolved?.postalCode ?? null,
      },
    });
    return resolved;
  }
}
