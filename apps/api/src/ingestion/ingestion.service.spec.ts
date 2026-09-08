import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env.schema.js';
import type { JobSourceConnector } from '../sources/job-source-connector.js';
import type { RawJob } from '../sources/raw-job.js';
import type { IngestionRepository } from './ingestion.repository.js';
import type { PersistOutcome } from './ingestion.types.js';
import { ALREADY_RUNNING } from './ingestion.constants.js';
import { IngestionService } from './ingestion.service.js';
import type { GeoPort } from './job-preparer.types.js';
import { PROFILE, rawJob } from './test-fixtures.js';

/**
 * Connector stub answering a fixed list, or failing with the given error.
 */
function connector(
  name: string,
  jobs: RawJob[] | Error,
  enabled = true,
): JobSourceConnector {
  return {
    name,
    isEnabled: () => enabled,
    fetchJobs: () =>
      jobs instanceof Error ? Promise.reject(jobs) : Promise.resolve(jobs),
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
    latestFinishedRun: vi.fn(async () => null),
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
 * Service wired with the stubs above.
 */
function service(connectors: JobSourceConnector[], repo = repository()) {
  return new IngestionService(
    connectors,
    PROFILE,
    geo,
    repo as unknown as IngestionRepository,
    config,
  );
}

/**
 * Orchestration of one run across sources.
 */
describe('IngestionService.run', () => {
  it('fetches, filters, persists and purges', async () => {
    const repo = repository();
    const svc = service(
      [connector('ft', [rawJob(), rawJob({ sourceId: '2', title: 'Comptable' })])],
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
    const summary = await service([connector('adzuna', [], false)], repo).run();
    expect(summary.skippedSources).toEqual(['adzuna']);
    expect(repo.startRun).not.toHaveBeenCalled();
  });

  it('records a failing source and keeps going with the next one', async () => {
    const repo = repository();
    const summary = await service(
      [connector('eures', new Error('boom')), connector('ft', [rawJob()])],
      repo,
    ).run();
    expect(summary.failedSources).toEqual(['eures']);
    expect(repo.failRun).toHaveBeenCalledWith('run-1', 'boom');
    expect(summary.kept).toBe(1);
  });

  it('counts merged offers', async () => {
    const summary = await service(
      [connector('ft', [rawJob()])],
      repository('merged'),
    ).run();
    expect(summary.merged).toBe(1);
    expect(summary.inserted).toBe(0);
  });

  it('is a no-op when a run is already in progress', async () => {
    let release!: () => void;
    const pending = new Promise<RawJob[]>((r) => (release = () => r([])));
    const svc = service([{ name: 'slow', isEnabled: () => true, fetchJobs: () => pending }]);

    const first = svc.run();
    const second = await svc.run();
    expect(second.skippedSources).toEqual([ALREADY_RUNNING]);

    release();
    await first;
    const third = await svc.run();
    expect(third.skippedSources).toEqual([]);
  });
});

/**
 * Per-source health report.
 */
describe('IngestionService.status', () => {
  it('reports the last finished run per source', async () => {
    const repo = repository();
    const at = new Date('2026-09-01T10:00:00Z');
    repo.latestFinishedRun.mockResolvedValueOnce({ finishedAt: at, error: null } as never);
    const [ft, adz] = await service(
      [connector('ft', []), connector('adzuna', [], false)],
      repo,
    ).status();

    expect(ft).toEqual({
      source: 'ft',
      enabled: true,
      lastRunAt: at.toISOString(),
      ok: true,
      error: null,
    });
    expect(adz).toMatchObject({ enabled: false, ok: false, lastRunAt: null });
  });
});
