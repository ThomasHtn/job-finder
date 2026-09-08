import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

/**
 * Read side of the offers; ingestion writes them in its own module.
 */
@Module({
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
