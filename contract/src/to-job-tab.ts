import { DEFAULT_JOB_TAB, JOB_TABS, type JobTab } from './job-tab.js';

/**
 * Narrows any user-provided value (query param, route input) to a known tab.
 * Unknown values fall back to the default tab instead of failing.
 */
export function toJobTab(value: unknown): JobTab {
  return JOB_TABS.includes(value as JobTab) ? (value as JobTab) : DEFAULT_JOB_TAB;
}
