import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IngestionSummary, JobSource, SourceStatus } from '@job-finder/shared';
import type { Env } from '../config/env.schema.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../config/search-profile.js';
import { GeoService } from '../geo/geo.service.js';
import type { JobSourceConnector } from '../sources/job-source-connector.js';
import { JOB_SOURCE_CONNECTORS } from '../sources/job-source-connectors.token.js';
import { emptySummary } from './empty-summary.js';
import { ALREADY_RUNNING, DAY_MS, RECENT_RUNS } from './ingestion.constants.js';
import { IngestionRepository } from './ingestion.repository.js';
import { prepareJob } from './job-preparer.js';
import type { GeoPort } from './job-preparer.types.js';
import { toSourceRun } from './to-source-run.js';

/**
 * Orchestrates one ingestion: fetch, filter, persist, purge.
 */
@Injectable()
export class IngestionService {
  /**
   * Scoped logger.
   */
  private readonly logger = new Logger(IngestionService.name);

  /**
   * Set while a run is in progress so overlapping triggers become no-ops.
   */
  private running = false;

  /**
   * Offers not seen for this long are dropped, unless they were favourited.
   */
  private readonly staleAfterDays: number;

  /**
   * Connectors are injected as a list so adding a source never touches this class.
   */
  constructor(
    @Inject(JOB_SOURCE_CONNECTORS)
    private readonly connectors: JobSourceConnector[],
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
    @Inject(GeoService) private readonly geo: GeoPort,
    private readonly repository: IngestionRepository,
    config: ConfigService<Env, true>,
  ) {
    this.staleAfterDays = config.get('INGESTION_STALE_DAYS', { infer: true });
  }

  /**
   * Runs every source in turn. A failing source never stops the others.
   */
  async run(): Promise<IngestionSummary> {
    if (this.running) {
      this.logger.warn('Ingestion already running, skipping this trigger');
      return emptySummary([ALREADY_RUNNING]);
    }
    this.running = true;

    const summary = emptySummary();
    try {
      for (const connector of this.connectors) {
        if (!connector.isEnabled()) {
          this.logger.warn(
            `Source ${connector.name} is not configured, skipping`,
          );
          summary.skippedSources.push(connector.name);
          continue;
        }
        await this.runSource(connector, summary);
      }
      const threshold = new Date(Date.now() - this.staleAfterDays * DAY_MS);
      summary.purged = await this.repository.purgeStaleJobs(threshold);
    } finally {
      this.running = false;
    }

    this.logger.log(
      `Ingestion done: ${summary.fetched} fetched, ${summary.kept} kept, ` +
        `${summary.inserted} new, ${summary.updated} updated, ${summary.merged} merged, ${summary.purged} purged`,
    );
    return summary;
  }

  /**
   * Health and recent history per connector, for the degraded flag and the sources tab.
   */
  async status(): Promise<SourceStatus[]> {
    const jobCounts = await this.repository.countJobsBySource();

    return Promise.all(
      this.connectors.map(async (connector) => {
        const enabled = connector.isEnabled();
        const [runs, lastSuccessAt] = await Promise.all([
          this.repository.recentRuns(connector.name, RECENT_RUNS),
          this.repository.lastSuccessAt(connector.name),
        ]);
        const lastRun = runs.at(0);

        return {
          source: connector.name as JobSource,
          enabled,
          lastRunAt: lastRun?.finishedAt?.toISOString() ?? null,
          ok: enabled && !lastRun?.error,
          error: lastRun?.error ?? null,
          lastSuccessAt: lastSuccessAt?.toISOString() ?? null,
          jobCount: jobCounts.get(connector.name) ?? 0,
          runs: runs.map(toSourceRun),
        };
      }),
    );
  }

  /**
   * Fetches one source, persists what passes the filters, and records the run.
   * Errors are captured on the run row and in the summary, never rethrown.
   */
  private async runSource(
    connector: JobSourceConnector,
    summary: IngestionSummary,
  ): Promise<void> {
    const runId = await this.repository.startRun(connector.name);

    try {
      const rawJobs = await connector.fetchJobs();
      let kept = 0;
      let inserted = 0;
      let updated = 0;

      for (const raw of rawJobs) {
        const prepared = await prepareJob(raw, this.profile, this.geo);
        if (!prepared) continue;
        kept += 1;

        const outcome = await this.repository.persistJob(prepared);
        if (outcome === 'inserted') inserted += 1;
        else if (outcome === 'updated') updated += 1;
        else summary.merged += 1;
      }

      summary.fetched += rawJobs.length;
      summary.kept += kept;
      summary.inserted += inserted;
      summary.updated += updated;

      await this.repository.finishRun(runId, {
        fetched: rawJobs.length,
        kept,
        inserted,
        updated,
      });
      this.logger.log(
        `${connector.name}: ${rawJobs.length} fetched, ${kept} kept`,
      );
    } catch (error) {
      const message = (error as Error).message;
      summary.failedSources.push(connector.name);
      await this.repository.failRun(runId, message);
      this.logger.error(`${connector.name} failed: ${message}`);
    }
  }
}
