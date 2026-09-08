import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../config/search-profile.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BanGeocoder, type ResolvedLocation } from './ban-geocoder.js';
import {
  isWithinArea,
  loadIsochrone,
  type Area,
  type Coordinates,
} from './commuting-area.js';

export type { ResolvedLocation } from './ban-geocoder.js';

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
   * True when the point is inside the commuting area.
   */
  isWithinArea(point: Coordinates): boolean {
    return isWithinArea(this.area, this.profile.area.center, point);
  }

  /**
   * Geocodes a free-form French location, caching both hits and misses.
   */
  async geocode(rawQuery: string): Promise<ResolvedLocation | null> {
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

    const resolved = await this.geocoder.resolve(query);
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
