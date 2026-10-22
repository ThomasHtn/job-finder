import { Injectable } from '@nestjs/common';

import type { JobSourceType } from '../generated/prisma/enums.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { MERGE_COLUMNS } from './ingestion.constants.js';
import type { FinishedRun, PersistOutcome, PreparedJob, RunCounters } from './ingestion.types.js';
import { ownFacts } from './own-facts.js';
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
  public async startRun(source: string): Promise<string> {
    const run = await this.prisma.ingestionRun.create({ data: { source } });
    return run.id;
  }

  /**
   * Closes a run with its figures.
   */
  public async finishRun(id: string, counters: RunCounters): Promise<void> {
    await this.prisma.ingestionRun.update({
      where: { id },
      data: { finishedAt: new Date(), ...counters },
    });
  }

  /**
   * Closes a run with the error that stopped it.
   */
  public async failRun(id: string, error: string): Promise<void> {
    await this.prisma.ingestionRun.update({
      where: { id },
      data: { finishedAt: new Date(), error },
    });
  }

  /**
   * Latest completed runs of one source, success or failure, newest first.
   */
  public recentRuns(source: string, take: number): Promise<FinishedRun[]> {
    return this.prisma.ingestionRun.findMany({
      where: { source, finishedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      take,
      select: {
        startedAt: true,
        finishedAt: true,
        fetched: true,
        kept: true,
        inserted: true,
        updated: true,
        error: true,
      },
    });
  }

  /**
   * End of the last successful run of one source, null if it never succeeded.
   */
  public async lastSuccessAt(source: string): Promise<Date | null> {
    const run = await this.prisma.ingestionRun.findFirst({
      where: { source, finishedAt: { not: null }, error: null },
      orderBy: { startedAt: 'desc' },
      select: { finishedAt: true },
    });
    return run?.finishedAt ?? null;
  }

  /**
   * Offers per source, keyed by source name.
   */
  public async countJobsBySource(): Promise<Map<string, number>> {
    const groups = await this.prisma.job.groupBy({
      by: ['source'],
      _count: { _all: true },
    });
    return new Map(groups.map((group) => [group.source, group._count._all]));
  }

  /**
   * Upserts by (source, sourceId); a twin from another source is enriched, not duplicated.
   */
  public async persistJob(job: PreparedJob): Promise<PersistOutcome> {
    const own = await this.prisma.job.findUnique({
      where: {
        source_sourceId: { source: job.source, sourceId: job.sourceId },
      },
      select: MERGE_COLUMNS,
    });
    if (own) {
      await this.prisma.job.update({
        where: { id: own.id },
        data: { ...ownFacts(job), ...planMerge(own, job, 'refresh') },
      });
      return 'updated';
    }

    const twin = await this.prisma.job.findFirst({
      where: { dedupeHash: job.dedupeHash, source: { not: job.source } },
      /* Oldest first, so the same row wins on every run when several boards list the offer. */
      orderBy: { firstSeenAt: 'asc' },
      select: MERGE_COLUMNS,
    });
    if (twin) {
      await this.prisma.job.update({
        where: { id: twin.id },
        data: planMerge(twin, job, 'merge'),
      });
      return 'merged';
    }

    await this.prisma.job.create({
      data: {
        ...ownFacts(job),
        url: job.url,
        description: job.description,
        hasFullDescription: job.hasFullDescription,
        sourceLabel: job.sourceLabel,
        publishedAt: job.publishedAt,
        source: job.source,
        sourceId: job.sourceId,
        alternativeUrls: job.alternativeUrls ?? [],
      },
    });
    return 'inserted';
  }

  /**
   * Source ids of the undated offers the purge already deleted for one source.
   */
  public async purgedSourceIds(source: JobSourceType): Promise<Set<string>> {
    const purged = await this.prisma.purgedJob.findMany({
      where: { source },
      select: { sourceId: true },
    });
    return new Set(purged.map((entry) => entry.sourceId));
  }

  /**
   * Deletes offers published before the cutoff, or first seen before it when the date is unknown,
   * keeping favourites. The undated ones are remembered, or the next run would bring them back.
   */
  public async purgeOldJobs(cutoff: Date): Promise<number> {
    const stale = await this.prisma.job.findMany({
      where: {
        isFavorite: false,
        OR: [{ publishedAt: { lt: cutoff } }, { publishedAt: null, firstSeenAt: { lt: cutoff } }],
      },
      select: { id: true, source: true, sourceId: true, publishedAt: true },
    });
    if (stale.length === 0) return 0;

    const undated = stale.filter((job) => job.publishedAt === null);

    await this.prisma.$transaction([
      this.prisma.purgedJob.createMany({
        data: undated.map(({ source, sourceId }) => ({ source, sourceId })),
        skipDuplicates: true,
      }),
      this.prisma.job.deleteMany({ where: { id: { in: stale.map((job) => job.id) } } }),
    ]);
    return stale.length;
  }
}
