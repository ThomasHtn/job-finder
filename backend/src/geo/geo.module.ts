import { Module } from '@nestjs/common';

import { BanGeocoderService } from './ban-geocoder.service.js';
import { GeoService } from './geo.service.js';

/**
 * Commuting-area check and cached geocoding; only the facade is exported.
 */
@Module({
  providers: [GeoService, BanGeocoderService],
  exports: [GeoService],
})
export class GeoModule {}
