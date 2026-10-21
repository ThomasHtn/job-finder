/**
 * Tabs of the UI: on-site offers in the configured area, fully remote ones, favourites.
 */
export const JOB_TABS = ['local', 'remote', 'favorites'] as const;

/**
 * One of the UI tabs.
 */
export type JobTab = (typeof JOB_TABS)[number];

/**
 * Tab shown when none (or an unknown one) is requested.
 */
export const DEFAULT_JOB_TAB: JobTab = 'local';
