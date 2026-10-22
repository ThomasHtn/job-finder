import { Module } from '@nestjs/common';

import { GeoModule } from '../geo/geo.module.js';
import { SourcesModule } from '../sources/sources.module.js';
import { IngestionController } from './ingestion.controller.js';
import { IngestionRepository } from './ingestion.repository.js';
import { IngestionService } from './ingestion.service.js';
import { IngestionHeartbeatService } from './ingestion-heartbeat.service.js';
import { IngestionSchedulerService } from './ingestion-scheduler.service.js';

/**
 * Write side of the offers: fetch from the sources, filter, persist, purge.
 */
@Module({
  imports: [SourcesModule, GeoModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    IngestionRepository,
    IngestionSchedulerService,
    IngestionHeartbeatService,
  ],
})
export class IngestionModule {}
