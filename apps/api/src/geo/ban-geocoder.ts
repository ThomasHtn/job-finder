import { Injectable, Logger } from '@nestjs/common';
import { GEOCODER_URL, TIMEOUT_MS } from './ban-geocoder.constants.js';
import type { BanFeature, ResolvedLocation } from './ban-geocoder.types.js';
import { parseBanResponse } from './parse-ban-response.js';

/**
 * HTTP client for the French national address base. Never throws: a failure is a miss.
 */
@Injectable()
export class BanGeocoder {
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(BanGeocoder.name);

  /**
   * Resolves a free-form French location to its best match.
   */
  async resolve(query: string): Promise<ResolvedLocation | null> {
    const url = `${GEOCODER_URL}?q=${encodeURIComponent(query)}&limit=1`;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Geocoder returned ${response.status} for "${query}"`);
        return null;
      }
      return parseBanResponse(
        (await response.json()) as { features?: BanFeature[] },
      );
    } catch (error) {
      this.logger.warn(
        `Geocoding failed for "${query}": ${(error as Error).message}`,
      );
      return null;
    }
  }
}
