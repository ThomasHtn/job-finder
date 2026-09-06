import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../config/search-profile.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  isWithinArea,
  loadIsochrone,
  type Area,
  type Coordinates,
} from './commuting-area.js';

const GEOCODER_URL = 'https://data.geopf.fr/geocodage/search';
/** Below this the BAN match is too loose to be trusted (wrong town, partial street). */
const MIN_SCORE = 0.4;

export interface ResolvedLocation extends Coordinates {
  city: string | null;
  postalCode: string | null;
}

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: { score: number; city?: string; postcode?: string };
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly area: Area | null = loadIsochrone();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {
    if (!this.area) {
      this.logger.warn(
        'No isochrone found, falling back to a straight-line radius. Run `npm run geo:isochrone` with ORS_API_KEY set.',
      );
    }
  }

  isWithinArea(point: Coordinates): boolean {
    return isWithinArea(this.area, this.profile.area.center, point);
  }

  /** Geocodes a free-form French location, caching both hits and misses. */
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

    const resolved = await this.callGeocoder(query);
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

  private async callGeocoder(query: string): Promise<ResolvedLocation | null> {
    const url = `${GEOCODER_URL}?q=${encodeURIComponent(query)}&limit=1`;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        this.logger.warn(`Geocoder returned ${response.status} for "${query}"`);
        return null;
      }

      const body = (await response.json()) as { features?: BanFeature[] };
      const feature = body.features?.[0];
      if (!feature || feature.properties.score < MIN_SCORE) return null;

      const [longitude, latitude] = feature.geometry.coordinates;
      return {
        latitude,
        longitude,
        city: feature.properties.city ?? null,
        postalCode: feature.properties.postcode ?? null,
      };
    } catch (error) {
      this.logger.warn(
        `Geocoding failed for "${query}": ${(error as Error).message}`,
      );
      return null;
    }
  }
}
