import type { JobTab } from '@job-finder/contract';

import { IconName } from '@shared/icon/icon.model';

import { SOURCES_TAB } from './jobs.constants';

/**
 * Every tab of the shell: the three offer lists, then the sources.
 */
export type ShellTab = JobTab | typeof SOURCES_TAB;

/**
 * One entry of the tab strip: where it leads, how it reads, and how many offers are behind it.
 */
export interface JobTabItem {
  /**
   * Tab this entry selects; the sources view is reached from the settings, not from here.
   */
  tab: JobTab;

  /**
   * Wording shown to the reader.
   */
  label: string;

  /**
   * Offers currently in that tab, `null` until the first list answers.
   */
  count: number | null;

  /**
   * Glyph drawn before the label.
   */
  icon: IconName;
}

/**
 * What the last manual refresh told, kept as data so its wording follows a language switch.
 */
export type RefreshOutcome = { kind: 'inserted'; count: number } | { kind: 'busy' };
