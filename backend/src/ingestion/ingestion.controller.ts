import { ConflictException, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import type { IngestionSummary, SourceStatus } from '@job-finder/contract';

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
   * Manual trigger, mostly useful right after a deployment; 200 as nothing is created, 409 while another run is in progress.
   */
  @Post('run')
  @HttpCode(HttpStatus.OK)
  public async run(): Promise<IngestionSummary> {
    const summary = await this.ingestion.run();
    if (!summary) throw new ConflictException('An ingestion is already running');
    return summary;
  }

  /**
   * Lets the UI flag when the list is only partial because a source is down.
   */
  @Get('status')
  public status(): Promise<SourceStatus[]> {
    return this.ingestion.status();
  }
}
