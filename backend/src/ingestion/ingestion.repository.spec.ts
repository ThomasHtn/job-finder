import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../shared/prisma/prisma.service.js';
import { rawJob } from '../sources/raw-job.fixtures.js';
import { IngestionRepository } from './ingestion.repository.js';
import type { PreparedJob } from './ingestion.types.js';

/**
 * A prepared offer, as the pipeline hands it to the repository.
 */
function prepared(overrides: Partial<PreparedJob> = {}): PreparedJob {
  return { ...rawJob(), dedupeHash: 'hash', ...overrides };
}

/**
 * Repository over a Prisma stand-in: `own` is the row of the same (source, sourceId), `twin` the
 * row sharing the dedupe hash.
 */
function build(options: {
  own?: {
    id: string;
    url: string;
    sourceLabel: string;
    hasFullDescription: boolean;
    alternativeUrls: string[];
  } | null;
  twin?: { id: string; url: string; hasFullDescription: boolean; alternativeUrls: string[] } | null;
}) {
  const prisma = {
    job: {
      findUnique: vi.fn(async () => options.own ?? null),
      findFirst: vi.fn(async () => options.twin ?? null),
      update: vi.fn(async () => ({})),
      create: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({ count: 3 })),
      groupBy: vi.fn(async () => [{ source: 'ADZUNA', _count: { _all: 5 } }]),
    },
    ingestionRun: {
      create: vi.fn(async () => ({ id: 'run-1' })),
      update: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async (): Promise<{ finishedAt: Date | null } | null> => null),
    },
  };
  return { repository: new IngestionRepository(prisma as unknown as PrismaService), prisma };
}

/**
 * The data argument of the first update call.
 */
function updatedData(prisma: ReturnType<typeof build>['prisma']): Record<string, unknown> {
  const [[{ data }]] = prisma.job.update.mock.calls as unknown as [
    [{ data: Record<string, unknown> }],
  ];
  return data;
}

/**
 * Upsert and merge of one offer.
 */
describe('IngestionRepository.persistJob', () => {
  it('inserts an offer seen for the first time', async () => {
    const { repository, prisma } = build({});

    await expect(repository.persistJob(prepared())).resolves.toBe('inserted');

    expect(prisma.job.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: 'FRANCE_TRAVAIL',
        sourceId: '1',
        dedupeHash: 'hash',
        alternativeUrls: [],
      }),
    });
  });

  it('updates its own row, keeping merged links and never listing its own url', async () => {
    const { repository, prisma } = build({
      own: {
        id: 'job-1',
        url: 'https://example.test/old',
        sourceLabel: 'France Travail',
        hasFullDescription: true,
        alternativeUrls: ['https://other.test/1', 'https://example.test/1'],
      },
    });

    await expect(repository.persistJob(prepared())).resolves.toBe('updated');

    const data = updatedData(prisma);
    expect(data.url).toBe('https://example.test/1');
    expect(data.alternativeUrls).toEqual(['https://other.test/1']);
    expect(prisma.job.findFirst).not.toHaveBeenCalled();
    expect(prisma.job.create).not.toHaveBeenCalled();
  });

  it('keeps the richer text a merge brought in when its own source only has a snippet', async () => {
    const { repository, prisma } = build({
      own: {
        id: 'job-1',
        url: 'https://other.test/full',
        sourceLabel: 'APEC',
        hasFullDescription: true,
        alternativeUrls: ['https://example.test/1'],
      },
    });

    await repository.persistJob(prepared({ hasFullDescription: false, description: 'Extrait' }));

    const data = updatedData(prisma);
    expect(data).not.toHaveProperty('url');
    expect(data).not.toHaveProperty('description');
    expect(data).not.toHaveProperty('hasFullDescription');
    expect(data).not.toHaveProperty('sourceLabel');
    expect(data.alternativeUrls).toEqual(['https://example.test/1']);
    expect(data.title).toBe('Développeur Full Stack H/F');
  });

  it('keeps the promoted link of another source when its own source takes the lead back', async () => {
    const { repository, prisma } = build({
      own: {
        id: 'job-1',
        url: 'https://other.test/full',
        sourceLabel: 'APEC',
        hasFullDescription: true,
        alternativeUrls: ['https://example.test/1'],
      },
    });

    await repository.persistJob(prepared());

    const data = updatedData(prisma);
    expect(data.url).toBe('https://example.test/1');
    expect(data.sourceLabel).toBe('France Travail');
    expect(data.alternativeUrls).toEqual(['https://other.test/full']);
  });

  it('merges into a twin from another source and marks it as seen', async () => {
    const { repository, prisma } = build({
      twin: {
        id: 'job-2',
        url: 'https://other.test/2',
        hasFullDescription: true,
        alternativeUrls: [],
      },
    });

    await expect(repository.persistJob(prepared())).resolves.toBe('merged');

    expect(prisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'job-2' } }),
    );
    const data = updatedData(prisma);
    expect(data.alternativeUrls).toEqual(['https://example.test/1']);
    expect(prisma.job.create).not.toHaveBeenCalled();
  });
});

/**
 * Run bookkeeping, counts and purge.
 */
describe('IngestionRepository runs and purge', () => {
  it('opens a run and closes it with its figures or its error', async () => {
    const { repository, prisma } = build({});

    await expect(repository.startRun('ADZUNA')).resolves.toBe('run-1');
    await repository.finishRun('run-1', { fetched: 3, kept: 2, inserted: 1, updated: 1 });
    await repository.failRun('run-1', 'boom');

    expect(prisma.ingestionRun.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'run-1' },
      data: expect.objectContaining({ finishedAt: expect.any(Date), fetched: 3, kept: 2 }),
    });
    expect(prisma.ingestionRun.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'run-1' },
      data: { finishedAt: expect.any(Date), error: 'boom' },
    });
  });

  it('reads the last success of a source, null when it never succeeded', async () => {
    const { repository, prisma } = build({});
    await expect(repository.lastSuccessAt('ADZUNA')).resolves.toBeNull();

    const finishedAt = new Date('2026-10-21T06:00:00.000Z');
    prisma.ingestionRun.findFirst.mockResolvedValue({ finishedAt });
    await expect(repository.lastSuccessAt('ADZUNA')).resolves.toBe(finishedAt);
  });

  it('counts the offers per source', async () => {
    const { repository } = build({});

    await expect(repository.countJobsBySource()).resolves.toEqual(new Map([['ADZUNA', 5]]));
  });

  it('purges the offers past the cutoff, dated by publication or first sight, but never a favourite', async () => {
    const { repository, prisma } = build({});
    const cutoff = new Date('2026-09-21T00:00:00.000Z');

    await expect(repository.purgeOldJobs(cutoff)).resolves.toBe(3);
    expect(prisma.job.deleteMany).toHaveBeenCalledWith({
      where: {
        isFavorite: false,
        OR: [{ publishedAt: { lt: cutoff } }, { publishedAt: null, firstSeenAt: { lt: cutoff } }],
      },
    });
  });
});
