import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module.js';
import { SourcesModule } from '../sources/sources.module.js';
import { IngestionController } from './ingestion.controller.js';
import { IngestionRepository } from './ingestion.repository.js';
import { IngestionScheduler } from './ingestion.scheduler.js';
import { IngestionService } from './ingestion.service.js';

/**
 * Write side of the offers: fetch from the sources, filter, persist, purge.
 */
@Module({
  imports: [SourcesModule, GeoModule],
  controllers: [IngestionController],
  providers: [IngestionService, IngestionRepository, IngestionScheduler],
})
export class IngestionModule {}
