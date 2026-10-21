import { translate } from '@jsverse/transloco';

import type { SourceRun, SourceStatus } from '@job-finder/contract';

import { isSingular } from '@core/i18n/i18n.utils';

import { SourceRow, SourceState } from './source-board.model';

/**
 * Reduces a status to its state: not configured, never run, last run fine, or last run failed.
 */
export function sourceState(status: SourceStatus): SourceState {
  if (!status.enabled) {
    return 'disabled';
  }
  if (status.runs.length === 0) {
    return 'never';
  }
  return status.ok ? 'ok' : 'failed';
}

/**
 * A count with its noun, in the active language: `key` names the two texts `<key>One`, `<key>Other`.
 */
export function countLabel(key: string, count: number): string {
  return translate(`${key}${isSingular(count) ? 'One' : 'Other'}`, { count });
}

/**
 * Figures of a finished run: fetched, kept, new.
 */
export function runFigures(run: SourceRun): string {
  return [
    countLabel('sources.fetched', run.fetched),
    countLabel('sources.kept', run.kept),
    countLabel('sources.inserted', run.inserted),
  ].join(', ');
}

/**
 * One source as the board shows it, worded in the active language.
 */
export function toSourceRow(status: SourceStatus): SourceRow {
  return {
    status,
    state: sourceState(status),
    offers: countLabel('sources.offers', status.jobCount),
    history: countLabel('sources.history', status.runs.length),
    runs: status.runs.map((run) => ({ run, result: run.error ?? runFigures(run) })),
  };
}
