import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  JobCounts,
  JobDetail,
  JobListResponse,
  JobSummary,
  JobTab,
} from '@job-finder/contract';

import type { JobModel } from '../generated/prisma/models.js';
import { SEARCH_PROFILE } from '../shared/config/search-profile.token.js';
import type { SearchProfile } from '../shared/config/search-profile.types.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { toDetail, toSummary } from './job.mapper.js';
import { tabWhere } from './tab-where.js';

/**
 * Queries behind the /jobs routes.
 */
@Injectable()
export class JobsService {
  /**
   * Direct Prisma access: the read side is simple enough not to need a repository. The profile
   * names the stack each offer is matched against.
   */
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
  ) {}

  /**
   * One tab's offers plus the counts of every tab and the last ingestion time.
   */
  public async list(tab: JobTab): Promise<JobListResponse> {
    const [jobs, counts, lastRun] = await Promise.all([
      this.prisma.job.findMany({
        where: tabWhere(tab),
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { firstSeenAt: 'desc' }],
      }),
      this.counts(),
      this.prisma.ingestionRun.findFirst({
        where: { finishedAt: { not: null }, error: null },
        orderBy: { startedAt: 'desc' },
        select: { finishedAt: true },
      }),
    ]);

    return {
      jobs: jobs.map((job) => toSummary(job, this.profile.stackKeywords)),
      counts,
      lastIngestionAt: lastRun?.finishedAt?.toISOString() ?? null,
    };
  }

  /**
   * Opening the detail is itself the "consulted" signal.
   */
  public async detail(id: string): Promise<JobDetail> {
    const job = await this.requireJob(id);
    const viewed = job.isViewed
      ? job
      : await this.prisma.job.update({
          where: { id },
          data: { isViewed: true },
        });
    return toDetail(viewed, this.profile.stackKeywords);
  }

  /**
   * Sets the favourite flag to the asked state, so repeating a call changes nothing.
   */
  public async setFavorite(id: string, isFavorite: boolean): Promise<JobSummary> {
    await this.requireJob(id);
    const updated = await this.prisma.job.update({ where: { id }, data: { isFavorite } });
    return toSummary(updated, this.profile.stackKeywords);
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
   * The groups are the (isRemote, isFavorite) pairs of the offers.
   */
  private async counts(): Promise<JobCounts> {
    const groups = await this.prisma.job.groupBy({
      by: ['isRemote', 'isFavorite'],
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
