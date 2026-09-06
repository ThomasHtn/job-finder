import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import type { IngestionSummary, JobSource, SourceStatus } from '@job-finder/shared';
import type { Env } from '../config/env.js';
import {
  SEARCH_PROFILE,
  type SearchProfile,
} from '../config/search-profile.js';
import { GeoService } from '../geo/geo.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  JOB_SOURCE_CONNECTORS,
  type JobSourceConnector,
  type RawJob,
} from '../sources/source.types.js';
import { detectPermanent, detectRemote, isWanted } from './classifier.js';
import { computeDedupeHash } from './dedupe.js';

/** Offers not seen for this long are dropped, unless they were favourited. */
const STALE_AFTER_DAYS = 30;

type PreparedJob = RawJob & { dedupeHash: string };

@Injectable()
export class IngestionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(IngestionService.name);
  private running = false;

  constructor(
    @Inject(JOB_SOURCE_CONNECTORS)
    private readonly connectors: JobSourceConnector[],
    @Inject(SEARCH_PROFILE) private readonly profile: SearchProfile,
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
    private readonly config: ConfigService<Env, true>,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    const expression = this.config.get('INGESTION_CRON', { infer: true });
    const job = new CronJob(expression, () => {
      void this.run();
    });
    this.scheduler.addCronJob('ingestion', job);
    job.start();
    this.logger.log(`Ingestion scheduled with cron "${expression}"`);

    if (this.config.get('INGESTION_ON_STARTUP', { infer: true })) {
      void this.run();
    }
  }

  /** Runs every source in turn. A failing source never stops the others. */
  async run(): Promise<IngestionSummary> {
    if (this.running) {
      this.logger.warn('Ingestion already running, skipping this trigger');
      return emptySummary(['already-running']);
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
      summary.purged = await this.purgeStaleJobs();
    } finally {
      this.running = false;
    }

    this.logger.log(
      `Ingestion done: ${summary.fetched} fetched, ${summary.kept} kept, ` +
        `${summary.inserted} new, ${summary.updated} updated, ${summary.merged} merged, ${summary.purged} purged`,
    );
    return summary;
  }

  /** Latest completed run per connector, so the UI can flag a partial list. */
  async status(): Promise<SourceStatus[]> {
    return Promise.all(
      this.connectors.map(async (connector) => {
        const enabled = connector.isEnabled();
        const lastRun = enabled
          ? await this.prisma.ingestionRun.findFirst({
              where: { source: connector.name, finishedAt: { not: null } },
              orderBy: { startedAt: 'desc' },
            })
          : null;

        return {
          source: connector.name as JobSource,
          enabled,
          lastRunAt: lastRun?.finishedAt?.toISOString() ?? null,
          ok: enabled && !lastRun?.error,
          error: lastRun?.error ?? null,
        };
      }),
    );
  }

  private async runSource(
    connector: JobSourceConnector,
    summary: IngestionSummary,
  ): Promise<void> {
    const run = await this.prisma.ingestionRun.create({
      data: { source: connector.name },
    });

    try {
      const rawJobs = await connector.fetchJobs();
      let kept = 0;
      let inserted = 0;
      let updated = 0;

      for (const raw of rawJobs) {
        const prepared = await this.prepare(raw);
        if (!prepared) continue;
        kept += 1;

        const outcome = await this.persist(prepared);
        if (outcome === 'inserted') inserted += 1;
        else if (outcome === 'updated') updated += 1;
        else summary.merged += 1;
      }

      summary.fetched += rawJobs.length;
      summary.kept += kept;
      summary.inserted += inserted;
      summary.updated += updated;

      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          finishedAt: new Date(),
          fetched: rawJobs.length,
          kept,
          inserted,
          updated,
        },
      });
      this.logger.log(
        `${connector.name}: ${rawJobs.length} fetched, ${kept} kept`,
      );
    } catch (error) {
      const message = (error as Error).message;
      summary.failedSources.push(connector.name);
      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: { finishedAt: new Date(), error: message },
      });
      this.logger.error(`${connector.name} failed: ${message}`);
    }
  }

  /** Applies the hard criteria. Returns null when the offer is out of scope. */
  private async prepare(raw: RawJob): Promise<PreparedJob | null> {
    if (!isWanted(raw, this.profile)) return null;
    if (!detectPermanent(raw)) return null;

    const isRemote = detectRemote(raw);
    let { latitude, longitude, city, postalCode } = raw;

    // Remote offers are kept wherever they are. Region-only offers cannot be checked
    // against the commuting area, so they are kept and flagged rather than dropped.
    if (!isRemote && !raw.isLocationApproximate) {
      if (latitude === null || longitude === null) {
        const query = raw.locationText ?? raw.city;
        const resolved = query ? await this.geo.geocode(query) : null;
        if (!resolved) return null;
        latitude = resolved.latitude;
        longitude = resolved.longitude;
        city ??= resolved.city;
        postalCode ??= resolved.postalCode;
      }
      if (!this.geo.isWithinArea({ latitude, longitude })) return null;
    }

    return {
      ...raw,
      isRemote,
      latitude,
      longitude,
      city,
      postalCode,
      dedupeHash: computeDedupeHash(
        raw.title,
        raw.company,
        isRemote ? 'remote' : city,
      ),
    };
  }

  private async persist(
    job: PreparedJob,
  ): Promise<'inserted' | 'updated' | 'merged'> {
    const data = {
      sourceLabel: job.sourceLabel,
      title: job.title,
      company: job.company,
      companyDescription: job.companyDescription,
      description: job.description,
      hasFullDescription: job.hasFullDescription,
      contractLabel: job.contractLabel,
      salary: job.salary,
      city: job.city,
      postalCode: job.postalCode,
      latitude: job.latitude,
      longitude: job.longitude,
      isRemote: job.isRemote,
      isLocationApproximate: job.isLocationApproximate,
      url: job.url,
      publishedAt: job.publishedAt,
      dedupeHash: job.dedupeHash,
    };

    const own = await this.prisma.job.findUnique({
      where: {
        source_sourceId: { source: job.source, sourceId: job.sourceId },
      },
    });
    if (own) {
      await this.prisma.job.update({ where: { id: own.id }, data });
      return 'updated';
    }

    // Same offer already stored from another source: enrich it instead of duplicating.
    const twin = await this.prisma.job.findFirst({
      where: { dedupeHash: job.dedupeHash },
    });
    if (twin) {
      await this.mergeInto(twin, job);
      return 'merged';
    }

    await this.prisma.job.create({
      data: { ...data, source: job.source, sourceId: job.sourceId },
    });
    return 'inserted';
  }

  /** Keeps the richest description and collects every known link to the offer. */
  private async mergeInto(
    twin: {
      id: string;
      url: string;
      hasFullDescription: boolean;
      alternativeUrls: string[];
    },
    job: PreparedJob,
  ): Promise<void> {
    const upgrade = job.hasFullDescription && !twin.hasFullDescription;
    const links = new Set([
      ...twin.alternativeUrls,
      upgrade ? twin.url : job.url,
    ]);
    links.delete(upgrade ? job.url : twin.url);

    await this.prisma.job.update({
      where: { id: twin.id },
      data: {
        alternativeUrls: [...links],
        ...(upgrade
          ? {
              url: job.url,
              description: job.description,
              hasFullDescription: true,
              sourceLabel: job.sourceLabel,
            }
          : {}),
      },
    });
  }

  private async purgeStaleJobs(): Promise<number> {
    const threshold = new Date(
      Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000,
    );
    const { count } = await this.prisma.job.deleteMany({
      where: { lastSeenAt: { lt: threshold }, isFavorite: false },
    });
    return count;
  }
}

function emptySummary(skipped: string[] = []): IngestionSummary {
  return {
    fetched: 0,
    kept: 0,
    inserted: 0,
    updated: 0,
    merged: 0,
    purged: 0,
    skippedSources: skipped,
    failedSources: [],
  };
}
