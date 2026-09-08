import { Controller, Get, Post } from '@nestjs/common';
import type { IngestionSummary, SourceStatus } from '@job-finder/shared';
import { IngestionService } from './ingestion.service.js';

/**
 * Manual entry points of the ingestion; the cron lives in the scheduler.
 */
@Controller('ingestion')
export class IngestionController {
  /**
   * Delegates everything to the service.
   */
  constructor(private readonly ingestion: IngestionService) {}

  /**
   * Manual trigger, mostly useful right after a deployment.
   */
  @Post('run')
  run(): Promise<IngestionSummary> {
    return this.ingestion.run();
  }

  /**
   * Lets the UI flag when the list is only partial because a source is down.
   */
  @Get('status')
  status(): Promise<SourceStatus[]> {
    return this.ingestion.status();
  }
}
