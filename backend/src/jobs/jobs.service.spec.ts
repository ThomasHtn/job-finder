import { NotFoundException } from '@nestjs/common';

import { describe, expect, it, vi } from 'vitest';

import type { JobModel } from '../generated/prisma/models.js';
import { PROFILE } from '../shared/config/search-profile.fixtures.js';
import type { PrismaService } from '../shared/prisma/prisma.service.js';
import { jobRow } from './job.fixtures.js';
import { JobsService } from './jobs.service.js';

/**
 * Prisma stand-in exposing only what the service touches.
 */
function build(
  groups: { isRemote: boolean; isFavorite: boolean; _count: { _all: number } }[],
  stored: JobModel | null = null,
) {
  const prisma = {
    job: {
      findMany: vi.fn(async (): Promise<JobModel[]> => []),
      findUnique: vi.fn(async () => stored),
      update: vi.fn(async ({ data }: { data: Partial<JobModel> }) =>
        jobRow({ ...stored, ...data }),
      ),
      groupBy: vi.fn(async () => groups),
    },
    ingestionRun: {
      findFirst: vi.fn(async (): Promise<{ finishedAt: Date | null } | null> => null),
    },
  };
  return { service: new JobsService(prisma as unknown as PrismaService, PROFILE), prisma };
}

/**
 * Tab counts derived from the grouped query.
 */
describe('JobsService.list counts', () => {
  it('splits the groups into local, remote and favourites', async () => {
    const { service, prisma } = build([
      { isRemote: false, isFavorite: false, _count: { _all: 7 } },
      { isRemote: false, isFavorite: true, _count: { _all: 2 } },
      { isRemote: true, isFavorite: true, _count: { _all: 1 } },
    ]);
    const { counts } = await service.list('local');
    expect(counts).toEqual({ local: 9, remote: 1, favorites: 3 });
    expect(prisma.job.groupBy).toHaveBeenCalledTimes(1);
  });

  it('reports zeros on an empty table', async () => {
    const { service } = build([]);
    const { counts } = await service.list('remote');
    expect(counts).toEqual({ local: 0, remote: 0, favorites: 0 });
  });
});

/**
 * Missing offers answer 404 on every mutating route.
 */
describe('JobsService not found', () => {
  it('rejects unknown ids', async () => {
    const { service } = build([]);
    await expect(service.detail('nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.setFavorite('nope', true)).rejects.toBeInstanceOf(NotFoundException);
  });
});

/**
 * Offers, filter and last run time of the list route.
 */
describe('JobsService.list', () => {
  it('lists the newest first, undated offers last', async () => {
    const { service, prisma } = build([]);

    await service.list('local');

    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { firstSeenAt: 'desc' }],
      }),
    );
  });

  it('filters on the tab and maps the offers', async () => {
    const { service, prisma } = build([]);
    prisma.job.findMany.mockResolvedValue([jobRow()]);

    const { jobs } = await service.list('remote');

    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isRemote: true } }),
    );
    expect(jobs.map((job) => job.id)).toEqual(['job-1']);
  });

  it('reports the end of the last successful run, or null before the first one', async () => {
    const { service, prisma } = build([]);
    expect((await service.list('local')).lastIngestionAt).toBeNull();

    prisma.ingestionRun.findFirst.mockResolvedValue({
      finishedAt: new Date('2026-10-21T06:00:00.000Z'),
    });
    expect((await service.list('local')).lastIngestionAt).toBe('2026-10-21T06:00:00.000Z');
  });
});

/**
 * Flags written by the detail and favourite routes.
 */
describe('JobsService flags', () => {
  it('marks an unseen offer as viewed when it is opened', async () => {
    const { service, prisma } = build([], jobRow());

    const detail = await service.detail('job-1');

    expect(prisma.job.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { isViewed: true },
    });
    expect(detail.isViewed).toBe(true);
  });

  it('does not write again when the offer was already viewed', async () => {
    const { service, prisma } = build([], jobRow({ isViewed: true }));

    await service.detail('job-1');

    expect(prisma.job.update).not.toHaveBeenCalled();
  });

  it('sets the favourite flag to the asked state, whatever it was', async () => {
    const off = build([], jobRow({ isFavorite: false }));
    expect((await off.service.setFavorite('job-1', true)).isFavorite).toBe(true);

    const on = build([], jobRow({ isFavorite: true }));
    expect((await on.service.setFavorite('job-1', true)).isFavorite).toBe(true);
    expect((await on.service.setFavorite('job-1', false)).isFavorite).toBe(false);
  });
});
