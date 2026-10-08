import type { SourceStatus } from '@job-finder/shared';

/**
 * Health of one source as the sources tab words it.
 */
export type SourceState = 'disabled' | 'never' | 'ok' | 'failed';

/**
 * Reduces a status to its state: not configured, never run, last run fine, or last run failed.
 */
export function sourceState(status: SourceStatus): SourceState {
  if (!status.enabled) return 'disabled';
  if (status.runs.length === 0) return 'never';
  return status.ok ? 'ok' : 'failed';
}
