import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  JobCounts,
  JobDetail,
  JobListResponse,
  JobSummary,
  JobTab,
} from '@job-finder/shared';
import type { JobModel } from '../generated/prisma/models.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toDetail, toSummary } from './job.mapper.js';

/**
 * Prisma filter selecting the offers of one tab. Hidden offers never show anywhere.
 */
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

/**
 * Queries behind the /jobs routes.
 */
@Injectable()
export class JobsService {
  /**
   * Direct Prisma access: the read side is simple enough not to need a repository.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One tab's offers plus the counts of every tab and the last ingestion time.
   */
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
        select: { finishedAt: true },
      }),
    ]);

    return {
      jobs: jobs.map(toSummary),
      counts,
      lastIngestionAt: lastRun?.finishedAt?.toISOString() ?? null,
    };
  }

  /**
   * Opening the detail is itself the "consulted" signal.
   */
  async detail(id: string): Promise<JobDetail> {
    const job = await this.requireJob(id);
    const viewed = job.isViewed
      ? job
      : await this.prisma.job.update({
          where: { id },
          data: { isViewed: true },
        });
    return toDetail(viewed);
  }

  /**
   * Flips the favourite flag.
   */
  async toggleFavorite(id: string): Promise<JobSummary> {
    const job = await this.requireJob(id);
    const updated = await this.prisma.job.update({
      where: { id },
      data: { isFavorite: !job.isFavorite },
    });
    return toSummary(updated);
  }

  /**
   * "Not interested": excludes the offer from every tab. No undo in the UI yet.
   */
  async hide(id: string): Promise<JobSummary> {
    await this.requireJob(id);
    const updated = await this.prisma.job.update({
      where: { id },
      data: { isHidden: true },
    });
    return toSummary(updated);
  }

  /**
   * Loads one offer or answers 404, the same way for every mutating route.
   */
  private async requireJob(id: string): Promise<JobModel> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  /**
   * Counts of the three tabs from a single grouped query instead of three counts.
   * The groups are the (isRemote, isFavorite) pairs of the visible offers.
   */
  private async counts(): Promise<JobCounts> {
    const groups = await this.prisma.job.groupBy({
      by: ['isRemote', 'isFavorite'],
      where: { isHidden: false },
      _count: { _all: true },
    });

    const counts: JobCounts = { local: 0, remote: 0, favorites: 0 };
    for (const group of groups) {
      const size = group._count._all;
      if (group.isRemote) counts.remote += size;
      else counts.local += size;
      if (group.isFavorite) counts.favorites += size;
    }
    return counts;
  }
}
