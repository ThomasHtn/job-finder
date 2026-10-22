import type { JobSource } from '@job-finder/contract';

import type { ResolvedLocation } from '../geo/ban-geocoder.types.js';
import type { Coordinates } from '../geo/geo.types.js';
import type { RawJob } from '../sources/raw-job.js';

/**
 * What happened to one prepared offer when it was written.
 */
export type PersistOutcome = 'inserted' | 'updated' | 'merged';

/**
 * What happened to one fetched offer: written, left out by the filters or the age limit, or
 * failed alone without stopping its board.
 */
export type OfferOutcome = PersistOutcome | 'skipped' | 'failed';

/**
 * How an incoming offer meets a row it duplicates: `refresh` is its own row seen again, `merge` a
 * twin published by another board.
 */
export type MergeMode = 'refresh' | 'merge';

/**
 * Figures recorded on a finished IngestionRun.
 */
export interface RunCounters {
  /**
   * Raw offers returned by the source.
   */
  fetched: number;

  /**
   * Offers that passed the filters.
   */
  kept: number;

  /**
   * Offers written for the first time.
   */
  inserted: number;

  /**
   * Offers already known from this source.
   */
  updated: number;
}

/**
 * A completed run of one source, with its figures.
 */
export interface FinishedRun extends RunCounters {
  /**
   * When the run started.
   */
  startedAt: Date;

  /**
   * When the run ended; never null once filtered on completion.
   */
  finishedAt: Date | null;

  /**
   * Failure message, null on success.
   */
  error: string | null;
}

/**
 * The columns of an existing offer that a merge reads.
 */
export interface Twin {
  /**
   * Database identifier of the row.
   */
  id: string;

  /**
   * Current main link of the row.
   */
  url: string;

  /**
   * Origin label the row currently shows.
   */
  sourceLabel: string;

  /**
   * Publication date the row holds, null when no board gave one.
   */
  publishedAt: Date | null;

  /**
   * Whether the twin already holds a full description.
   */
  hasFullDescription: boolean;

  /**
   * Links already collected from other sources.
   */
  alternativeUrls: string[];
}

/**
 * A source whose fetch failed during a run, with the reason.
 */
export interface SourceFailure {
  /**
   * Connector name, e.g. FRANCE_TRAVAIL.
   */
  source: JobSource;

  /**
   * Error message of the fetch.
   */
  error: string;
}

/**
 * What the heartbeat reports about one run to the push monitor.
 */
export interface HeartbeatReport {
  /**
   * "down" turns the monitor red, and uptime-kuma alerts.
   */
  status: 'up' | 'down';

  /**
   * One line shown in the alert.
   */
  msg: string;
}

/**
 * A raw offer that passed the filters, with its similarity key computed. Its coordinates only serve
 * the area check, so they stop here.
 */
export type PreparedJob = Omit<RawJob, 'latitude' | 'longitude'> & { dedupeHash: string };

/**
 * The slice of GeoService the pipeline needs, so tests can fake it.
 */
export interface GeoPort {
  /**
   * Free-form location to coordinates, null when unknown.
   */
  geocode(query: string): Promise<ResolvedLocation | null>;

  /**
   * True when the point is inside the commuting area.
   */
  isWithinArea(point: Coordinates): boolean;
}
