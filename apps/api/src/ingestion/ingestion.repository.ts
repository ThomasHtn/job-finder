import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  FinishedRun,
  PersistOutcome,
  RunCounters,
} from './ingestion.types.js';
import type { PreparedJob } from './job-preparer.types.js';
import { planMerge } from './plan-merge.js';

/**
 * Every database access of the ingestion pipeline lives here.
 */
@Injectable()
export class IngestionRepository {
  /**
   * Single Prisma client shared with the rest of the api.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Opens a run row for one source and returns its id.
   */
  async startRun(source: string): Promise<string> {
    const run = await this.prisma.ingestionRun.create({ data: { source } });
    return run.id;
  }

  /**
   * Closes a run with its figures.
   */
  async finishRun(id: string, counters: RunCounters): Promise<void> {
    await this.prisma.ingestionRun.update({
      where: { id },
      data: { finishedAt: new Date(), ...counters },
    });
  }

  /**
   * Closes a run with the error that stopped it.
   */
  async failRun(id: string, error: string): Promise<void> {
    await this.prisma.ingestionRun.update({
      where: { id },
      data: { finishedAt: new Date(), error },
    });
  }

  /**
   * Last completed run of one source, success or failure.
   */
  latestFinishedRun(source: string): Promise<FinishedRun | null> {
    return this.prisma.ingestionRun.findFirst({
      where: { source, finishedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      select: { finishedAt: true, error: true },
    });
  }

  /**
   * Upserts by (source, sourceId); a twin from another source is enriched, not duplicated.
   */
  async persistJob(job: PreparedJob): Promise<PersistOutcome> {
    const data = {
      sourceLabel: job.sourceLabel,
      title: job.title,
      company: job.company,
      companyDescription: job.companyDescription,
      description: job.description,
      hasFullDescription: job.hasFullDescription,
      contractLabel: job.contractLabel,
      salary: job.salary,
      city: job.city,
      postalCode: job.postalCode,
      latitude: job.latitude,
      longitude: job.longitude,
      isRemote: job.isRemote,
      isLocationApproximate: job.isLocationApproximate,
      url: job.url,
      publishedAt: job.publishedAt,
      dedupeHash: job.dedupeHash,
    };

    const own = await this.prisma.job.findUnique({
      where: {
        source_sourceId: { source: job.source, sourceId: job.sourceId },
      },
      select: { id: true },
    });
    if (own) {
      await this.prisma.job.update({ where: { id: own.id }, data });
      return 'updated';
    }

    const twin = await this.prisma.job.findFirst({
      where: { dedupeHash: job.dedupeHash },
      select: { id: true, url: true, hasFullDescription: true, alternativeUrls: true },
    });
    if (twin) {
      await this.prisma.job.update({
        where: { id: twin.id },
        data: planMerge(twin, job),
      });
      return 'merged';
    }

    await this.prisma.job.create({
      data: { ...data, source: job.source, sourceId: job.sourceId },
    });
    return 'inserted';
  }

  /**
   * Deletes offers not seen since the threshold, keeping favourites.
   */
  async purgeStaleJobs(threshold: Date): Promise<number> {
    const { count } = await this.prisma.job.deleteMany({
      where: { lastSeenAt: { lt: threshold }, isFavorite: false },
    });
    return count;
  }
}
