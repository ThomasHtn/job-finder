import { BadRequestException, Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';

import {
  type JobDetail,
  type JobListResponse,
  type JobSummary,
  toJobTab,
} from '@job-finder/contract';

import { JobsService } from './jobs.service.js';

/**
 * Read and flag offers. Every route is behind the global AuthGuard.
 */
@Controller('jobs')
export class JobsController {
  /**
   * Thin controller: parsing here, everything else in the service.
   */
  constructor(private readonly jobs: JobsService) {}

  /**
   * Offers of one tab; an unknown tab silently falls back to the default one.
   */
  @Get()
  public list(@Query('tab') tab?: string): Promise<JobListResponse> {
    return this.jobs.list(toJobTab(tab));
  }

  /**
   * Full offer; opening it also marks it as viewed.
   */
  @Get(':id')
  public detail(@Param('id') id: string): Promise<JobDetail> {
    return this.jobs.detail(id);
  }

  /**
   * Stars or un-stars the offer, as the body says; 400 unless `isFavorite` is a boolean.
   */
  @Patch(':id/favorite')
  public setFavorite(
    @Param('id') id: string,
    @Body('isFavorite') isFavorite: unknown,
  ): Promise<JobSummary> {
    if (typeof isFavorite !== 'boolean') {
      throw new BadRequestException('isFavorite must be a boolean');
    }
    return this.jobs.setFavorite(id, isFavorite);
  }
}
