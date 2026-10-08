import { JOB_TABS, toJobTab, type JobTab } from '@job-finder/shared';

/**
 * Tab of the shell that shows the sources instead of a list of offers. Web only: the API
 * never lists offers for it.
 */
export const SOURCES_TAB = 'sources';

/**
 * Every tab of the shell: the three offer lists, then the sources.
 */
export type ShellTab = JobTab | typeof SOURCES_TAB;

/**
 * Narrows the `?tab=` value, falling back to the default offer tab like `toJobTab`.
 */
export function toShellTab(value: unknown): ShellTab {
  return value === SOURCES_TAB || JOB_TABS.includes(value as JobTab)
    ? (value as ShellTab)
    : toJobTab(value);
}
