import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  JOB_TABS,
  type JobDetail,
  type JobListResponse,
  type JobSummary,
  type JobTab,
} from '@job-finder/shared';
import { JobsService } from './jobs.service.js';

function parseTab(value: string | undefined): JobTab {
  return JOB_TABS.includes(value as JobTab) ? (value as JobTab) : 'local';
}

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@Query('tab') tab?: string): Promise<JobListResponse> {
    return this.jobs.list(parseTab(tab));
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<JobDetail> {
    return this.jobs.detail(id);
  }

  @Patch(':id/favorite')
  toggleFavorite(@Param('id') id: string): Promise<JobSummary> {
    return this.jobs.toggleFavorite(id);
  }

  @Patch(':id/hide')
  hide(@Param('id') id: string): Promise<JobSummary> {
    return this.jobs.hide(id);
  }
}
