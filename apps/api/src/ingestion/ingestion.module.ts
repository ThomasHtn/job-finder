import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module.js';
import { SourcesModule } from '../sources/sources.module.js';
import { IngestionController } from './ingestion.controller.js';
import { IngestionService } from './ingestion.service.js';

@Module({
  imports: [SourcesModule, GeoModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
