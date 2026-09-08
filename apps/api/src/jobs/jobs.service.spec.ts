import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { JobsService } from './jobs.service.js';

/**
 * Prisma stand-in exposing only what the service touches.
 */
function build(groups: { isRemote: boolean; isFavorite: boolean; _count: { _all: number } }[]) {
  const prisma = {
    job: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      groupBy: vi.fn(async () => groups),
    },
    ingestionRun: { findFirst: vi.fn(async () => null) },
  };
  return { service: new JobsService(prisma as unknown as PrismaService), prisma };
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
    await expect(service.toggleFavorite('nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.hide('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
