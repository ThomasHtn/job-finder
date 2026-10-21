import type { SourceRun, SourceStatus } from '@job-finder/contract';

import { SOURCE_STATES } from './source-board.constants';

/**
 * Health of one source as the sources tab words it.
 */
export type SourceState = (typeof SOURCE_STATES)[number];

/**
 * One finished run, with its figures already worded.
 */
export interface SourceRunRow {
  /**
   * The run as the API reports it.
   */
  run: SourceRun;

  /**
   * Its error, or its figures in the active language.
   */
  result: string;
}

/**
 * One source of the board, with its counts already worded.
 */
export interface SourceRow {
  /**
   * The status as the API reports it.
   */
  status: SourceStatus;

  /**
   * Its health in one word.
   */
  state: SourceState;

  /**
   * Offers it holds, e.g. "12 offers".
   */
  offers: string;

  /**
   * Handle of the folded history, e.g. "Last 3 runs".
   */
  history: string;

  /**
   * Latest runs, newest first.
   */
  runs: SourceRunRow[];
}
