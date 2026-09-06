import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  JobCounts,
  JobDetail,
  JobListResponse,
  JobSummary,
  JobTab,
} from '@job-finder/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { toDetail, toSummary } from './job.mapper.js';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tab: JobTab): Promise<JobListResponse> {
    const [jobs, counts, lastRun] = await Promise.all([
      this.prisma.job.findMany({
        where: tabWhere(tab),
        orderBy: [{ publishedAt: 'desc' }, { firstSeenAt: 'desc' }],
      }),
      this.counts(),
      this.prisma.ingestionRun.findFirst({
        where: { finishedAt: { not: null }, error: null },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return {
      jobs: jobs.map(toSummary),
      counts,
      lastIngestionAt: lastRun?.finishedAt?.toISOString() ?? null,
    };
  }

  /** Opening the detail is itself the "consulted" signal. */
  async detail(id: string): Promise<JobDetail> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);

    const viewed = job.isViewed
      ? job
      : await this.prisma.job.update({
          where: { id },
          data: { isViewed: true },
        });
    return toDetail(viewed);
  }

  async toggleFavorite(id: string): Promise<JobSummary> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);

    const updated = await this.prisma.job.update({
      where: { id },
      data: { isFavorite: !job.isFavorite },
    });
    return toSummary(updated);
  }

  /** "Not interested": excludes the offer from every tab. No undo in the UI yet. */
  async hide(id: string): Promise<JobSummary> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);

    const updated = await this.prisma.job.update({
      where: { id },
      data: { isHidden: true },
    });
    return toSummary(updated);
  }

  private async counts(): Promise<JobCounts> {
    const [local, remote, favorites] = await Promise.all([
      this.prisma.job.count({ where: tabWhere('local') }),
      this.prisma.job.count({ where: tabWhere('remote') }),
      this.prisma.job.count({ where: tabWhere('favorites') }),
    ]);
    return { local, remote, favorites };
  }
}

function tabWhere(tab: JobTab) {
  switch (tab) {
    case 'local':
      return { isRemote: false, isHidden: false };
    case 'remote':
      return { isRemote: true, isHidden: false };
    case 'favorites':
      return { isFavorite: true, isHidden: false };
  }
}
