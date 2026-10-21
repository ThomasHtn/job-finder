import type { IngestionSummary } from '@job-finder/contract';

import { HEARTBEAT_ERROR_MAX, HEARTBEAT_MSG_MAX } from './ingestion.constants.js';
import type { HeartbeatReport, SourceFailure } from './ingestion.types.js';

/**
 * Cuts a text to a length, marking the cut.
 */
function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

/**
 * Heartbeat of a finished run: down as soon as one enabled source failed.
 */
export function describeRun(
  summary: IngestionSummary,
  failures: SourceFailure[],
  enabledSources: number,
): HeartbeatReport {
  if (failures.length > 0) {
    const reasons = failures
      .map(({ source, error }) => `${source} (${truncate(error, HEARTBEAT_ERROR_MAX)})`)
      .join(', ');
    const msg = `${failures.length} of ${enabledSources} sources failed: ${reasons}`;
    return { status: 'down', msg: truncate(msg, HEARTBEAT_MSG_MAX) };
  }

  const skipped = summary.skippedSources.length;
  const notConfigured = skipped > 0 ? ` (${skipped} not configured)` : '';
  return {
    status: 'up',
    msg: `${enabledSources} sources ok${notConfigured}, ${summary.kept} kept, ${summary.inserted} new`,
  };
}

/**
 * Heartbeat of a run that stopped before its end, e.g. the database went away.
 */
export function describeCrash(error: unknown): HeartbeatReport {
  const reason = error instanceof Error ? error.message : String(error);
  return { status: 'down', msg: truncate(`Ingestion crashed: ${reason}`, HEARTBEAT_MSG_MAX) };
}
