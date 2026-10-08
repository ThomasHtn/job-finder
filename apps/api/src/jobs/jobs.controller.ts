import { Controller, Get, Param, Patch, Query } from '@nestjs/common';

import {
  type JobDetail,
  type JobListResponse,
  type JobSummary,
  toJobTab,
} from '@job-finder/shared';

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
   * Stars or un-stars the offer.
   */
  @Patch(':id/favorite')
  public toggleFavorite(@Param('id') id: string): Promise<JobSummary> {
    return this.jobs.toggleFavorite(id);
  }

  /**
   * "Not interested": the offer leaves every tab.
   */
  @Patch(':id/hide')
  public hide(@Param('id') id: string): Promise<JobSummary> {
    return this.jobs.hide(id);
  }
}
