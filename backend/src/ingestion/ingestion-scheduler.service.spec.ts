import type { ConfigService } from '@nestjs/config';
import type { SchedulerRegistry } from '@nestjs/schedule';

import type { CronJob } from 'cron';
import { describe, expect, it, vi } from 'vitest';

import type { Env } from '../shared/config/env.schema.js';
import type { IngestionService } from './ingestion.service.js';
import { IngestionSchedulerService } from './ingestion-scheduler.service.js';

/**
 * Settings of a scheduler that also runs at startup.
 */
const SETTINGS: Partial<Record<keyof Env, unknown>> = {
  INGESTION_CRON: '0 0 */2 * * *',
  INGESTION_CRON_ENABLED: true,
  INGESTION_ON_STARTUP: true,
};

/**
 * Wiring of the cron and the startup run.
 */
describe('IngestionSchedulerService', () => {
  it('keeps a crashed startup run from escaping as an unhandled rejection', async () => {
    const run = vi.fn(() => Promise.reject(new Error('database gone')));
    const registry = { addCronJob: vi.fn() };
    const scheduler = new IngestionSchedulerService(
      { run } as unknown as IngestionService,
      { get: (key: keyof Env) => SETTINGS[key] } as unknown as ConfigService<Env, true>,
      registry as unknown as SchedulerRegistry,
    );

    scheduler.onApplicationBootstrap();
    /* Lets the rejected run settle: vitest fails the file on an unhandled rejection. */
    await new Promise((resolve) => setImmediate(resolve));

    expect(run).toHaveBeenCalledOnce();
    const [[name, job]] = registry.addCronJob.mock.calls as [[string, CronJob]];
    expect(name).toBe('ingestion');
    expect(job.cronTime.timeZone).toBe('UTC');
    await job.stop();
  });

  it('registers no cron when it is switched off, and still runs at startup when asked', () => {
    const run = vi.fn(async () => undefined);
    const registry = { addCronJob: vi.fn() };
    const settings = { ...SETTINGS, INGESTION_CRON_ENABLED: false };
    const scheduler = new IngestionSchedulerService(
      { run } as unknown as IngestionService,
      { get: (key: keyof Env) => settings[key] } as unknown as ConfigService<Env, true>,
      registry as unknown as SchedulerRegistry,
    );

    scheduler.onApplicationBootstrap();

    expect(registry.addCronJob).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledOnce();
  });
});
