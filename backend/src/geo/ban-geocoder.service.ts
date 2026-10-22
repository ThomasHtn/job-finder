import { Injectable } from '@nestjs/common';

import { GEOCODER_URL, TIMEOUT_MS } from './ban-geocoder.constants.js';
import type { BanResponse, ResolvedLocation } from './ban-geocoder.types.js';
import { parseBanResponse } from './parse-ban-response.js';

/**
 * HTTP client for the French national address base.
 */
@Injectable()
export class BanGeocoderService {
  /**
   * Resolves a free-form French location to its best match, null when nothing matches.
   * Throws when the address base cannot answer, so a passing outage is never mistaken for a miss.
   */
  public async resolve(query: string): Promise<ResolvedLocation | null> {
    const url = `${GEOCODER_URL}?q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    return parseBanResponse((await response.json()) as BanResponse);
  }
}
