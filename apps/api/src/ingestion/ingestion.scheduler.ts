import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import type { Env } from '../config/env.js';
import { IngestionService } from './ingestion.service.js';

/**
 * Name of the cron job in the Nest scheduler registry.
 */
const CRON_JOB_NAME = 'ingestion';

/**
 * Wires the cron and the optional startup run; the service itself knows nothing about time.
 */
@Injectable()
export class IngestionScheduler implements OnApplicationBootstrap {
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(IngestionScheduler.name);

  /**
   * The service to trigger, the schedule to read, the registry to attach to.
   */
  constructor(
    private readonly ingestion: IngestionService,
    private readonly config: ConfigService<Env, true>,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  /**
   * Registers the cron once every module is ready, then optionally runs at once.
   */
  onApplicationBootstrap(): void {
    const expression = this.config.get('INGESTION_CRON', { infer: true });
    const job = new CronJob(expression, () => {
      void this.ingestion.run();
    });
    this.scheduler.addCronJob(CRON_JOB_NAME, job);
    job.start();
    this.logger.log(`Ingestion scheduled with cron "${expression}"`);

    if (this.config.get('INGESTION_ON_STARTUP', { infer: true })) {
      void this.ingestion.run();
    }
  }
}
