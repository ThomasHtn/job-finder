import { Module } from '@nestjs/common';
import { BanGeocoder } from './ban-geocoder.js';
import { GeoService } from './geo.service.js';

/**
 * Commuting-area check and cached geocoding; only the facade is exported.
 */
@Module({
  providers: [GeoService, BanGeocoder],
  exports: [GeoService],
})
export class GeoModule {}
