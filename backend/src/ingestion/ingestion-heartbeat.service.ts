import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../shared/config/env.schema.js';
import { HEARTBEAT_TIMEOUT_MS } from './ingestion.constants.js';
import type { HeartbeatReport } from './ingestion.types.js';

/**
 * Tells an uptime-kuma push monitor how each run went: kuma owns the alerting, the app never talks
 * to a chat. A missing ping turns the monitor red too, so a cron that stopped firing is caught.
 */
@Injectable()
export class IngestionHeartbeatService {
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(IngestionHeartbeatService.name);

  /**
   * Push URL, undefined when no monitor is configured.
   */
  private readonly url: string | undefined;

  /**
   * Reads INGESTION_HEARTBEAT_URL once.
   */
  constructor(config: ConfigService<Env, true>) {
    this.url = config.get('INGESTION_HEARTBEAT_URL', { infer: true });
  }

  /**
   * Pings the monitor; a failure is logged and swallowed, it must never fail a run.
   */
  public async send(report: HeartbeatReport, durationMs: number): Promise<void> {
    if (!this.url) return;

    const url = new URL(this.url);
    url.searchParams.set('status', report.status);
    url.searchParams.set('msg', report.msg);
    url.searchParams.set('ping', String(Math.round(durationMs)));
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS) });
      if (!response.ok) this.logger.warn(`Heartbeat refused (${response.status})`);
    } catch (error) {
      this.logger.warn(`Heartbeat failed: ${(error as Error).message}`);
    }
  }
}
