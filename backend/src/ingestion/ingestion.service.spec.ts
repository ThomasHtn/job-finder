import type { ConfigService } from '@nestjs/config';

import { describe, expect, it, vi } from 'vitest';

import type { JobSource } from '@job-finder/contract';

import type { Env } from '../shared/config/env.schema.js';
import { PROFILE } from '../shared/config/search-profile.fixtures.js';
import type { JobSourceConnector } from '../sources/job-source-connector.js';
import { rawJob } from '../sources/raw-job.fixtures.js';
import type { RawJob } from '../sources/raw-job.js';
import type { IngestionRepository } from './ingestion.repository.js';
import { IngestionService } from './ingestion.service.js';
import type { FinishedRun, PersistOutcome } from './ingestion.types.js';
import type { GeoPort } from './ingestion.types.js';
import type { IngestionHeartbeat } from './ingestion-heartbeat.js';

/**
 * Connector stub answering a fixed list, or failing with the given error.
 */
function connector(name: JobSource, jobs: RawJob[] | Error, enabled = true): JobSourceConnector {
  return {
    name,
    isEnabled: () => enabled,
    fetchJobs: () => (jobs instanceof Error ? Promise.reject(jobs) : Promise.resolve(jobs)),
  };
}

/**
 * Repository stub recording every call.
 */
function repository(outcome: PersistOutcome = 'inserted') {
  return {
    startRun: vi.fn(async () => 'run-1'),
    finishRun: vi.fn(async () => {}),
    failRun: vi.fn(async () => {}),
    recentRuns: vi.fn(async (): Promise<FinishedRun[]> => []),
    lastSuccessAt: vi.fn(async (): Promise<Date | null> => null),
    countJobsBySource: vi.fn(async () => new Map([['FRANCE_TRAVAIL', 4]])),
    persistJob: vi.fn(async () => outcome),
    purgeStaleJobs: vi.fn(async () => 2),
  };
}

/**
 * Geo stub accepting every point.
 */
const geo: GeoPort = { geocode: async () => null, isWithinArea: () => true };

/**
 * Config stub answering the purge delay only.
 */
const config = { get: () => 30 } as unknown as ConfigService<Env, true>;

/**
 * Heartbeat stub recording every report.
 */
function heartbeat() {
  return { send: vi.fn(async () => {}) };
}

/**
 * Service wired with the stubs above.
 */
function service(connectors: JobSourceConnector[], repo = repository(), beat = heartbeat()) {
  return new IngestionService(
    connectors,
    PROFILE,
    geo,
    repo as unknown as IngestionRepository,
    config,
    beat as unknown as IngestionHeartbeat,
  );
}

/**
 * Orchestration of one run across sources.
 */
describe('IngestionService.run', () => {
  it('fetches, filters, persists and purges', async () => {
    const repo = repository();
    const svc = service(
      [connector('FRANCE_TRAVAIL', [rawJob(), rawJob({ sourceId: '2', title: 'Comptable' })])],
      repo,
    );

    const summary = await svc.run();

    expect(summary).toMatchObject({
      fetched: 2,
      kept: 1,
      inserted: 1,
      purged: 2,
      skippedSources: [],
      failedSources: [],
    });
    expect(repo.persistJob).toHaveBeenCalledTimes(1);
    expect(repo.finishRun).toHaveBeenCalledWith('run-1', {
      fetched: 2,
      kept: 1,
      inserted: 1,
      updated: 0,
    });
  });

  it('skips disabled sources without opening a run', async () => {
    const repo = repository();
    const summary = await service([connector('ADZUNA', [], false)], repo).run();
    expect(summary?.skippedSources).toEqual(['ADZUNA']);
    expect(repo.startRun).not.toHaveBeenCalled();
  });

  it('records a failing source and keeps going with the next one', async () => {
    const repo = repository();
    const summary = await service(
      [connector('EURES', new Error('boom')), connector('FRANCE_TRAVAIL', [rawJob()])],
      repo,
    ).run();
    expect(summary?.failedSources).toEqual(['EURES']);
    expect(repo.failRun).toHaveBeenCalledWith('run-1', 'boom');
    expect(summary?.kept).toBe(1);
  });

  it('reports a healthy run to the heartbeat', async () => {
    const beat = heartbeat();
    await service([connector('FRANCE_TRAVAIL', [rawJob()])], repository(), beat).run();

    expect(beat.send).toHaveBeenCalledWith(
      { status: 'up', msg: '1 sources ok, 1 kept, 1 new' },
      expect.any(Number),
    );
  });

  it('reports a failing source as down with its reason', async () => {
    const beat = heartbeat();
    await service(
      [connector('EURES', new Error('boom')), connector('FRANCE_TRAVAIL', [rawJob()])],
      repository(),
      beat,
    ).run();

    expect(beat.send).toHaveBeenCalledWith(
      { status: 'down', msg: '1 of 2 sources failed: EURES (boom)' },
      expect.any(Number),
    );
  });

  it('reports a crashed run as down, then rethrows', async () => {
    const repo = repository();
    repo.purgeStaleJobs.mockRejectedValueOnce(new Error('database gone'));
    const beat = heartbeat();
    const svc = service([connector('FRANCE_TRAVAIL', [])], repo, beat);

    await expect(svc.run()).rejects.toThrow('database gone');
    expect(beat.send).toHaveBeenCalledWith(
      { status: 'down', msg: 'Ingestion crashed: database gone' },
      expect.any(Number),
    );
    expect((await svc.run())?.skippedSources).toEqual([]);
  });

  it('counts merged offers', async () => {
    const summary = await service(
      [connector('FRANCE_TRAVAIL', [rawJob()])],
      repository('merged'),
    ).run();
    expect(summary?.merged).toBe(1);
    expect(summary?.inserted).toBe(0);
  });

  it('is a no-op when a run is already in progress', async () => {
    let release!: () => void;
    const pending = new Promise<RawJob[]>((r) => (release = () => r([])));
    const svc = service([{ name: 'APEC', isEnabled: () => true, fetchJobs: () => pending }]);

    const first = svc.run();
    expect(await svc.run()).toBeNull();

    release();
    await first;
    expect(await svc.run()).not.toBeNull();
  });
});

/**
 * Per-source health report.
 */
describe('IngestionService.status', () => {
  it('reports the last finished run, last success and stock per source', async () => {
    const repo = repository();
    const started = new Date('2026-09-01T09:59:00Z');
    const at = new Date('2026-09-01T10:00:00Z');
    const success = new Date('2026-08-31T10:00:00Z');
    const run = {
      startedAt: started,
      finishedAt: at,
      fetched: 5,
      kept: 2,
      inserted: 1,
      updated: 1,
      error: 'Adzuna search failed (503): HTML error page',
    };
    repo.recentRuns.mockResolvedValueOnce([run]);
    repo.lastSuccessAt.mockResolvedValueOnce(success);
    const [ft, adz] = await service(
      [connector('FRANCE_TRAVAIL', []), connector('ADZUNA', [], false)],
      repo,
    ).status();

    expect(ft).toEqual({
      source: 'FRANCE_TRAVAIL',
      enabled: true,
      lastRunAt: at.toISOString(),
      ok: false,
      error: run.error,
      lastSuccessAt: success.toISOString(),
      jobCount: 4,
      runs: [
        {
          ...run,
          startedAt: started.toISOString(),
          finishedAt: at.toISOString(),
        },
      ],
    });
    expect(adz).toMatchObject({ enabled: false, ok: false, lastRunAt: null, jobCount: 0 });
  });
});
