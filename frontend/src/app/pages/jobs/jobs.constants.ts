import type { JobCounts } from '@job-finder/contract';

/**
 * Tab of the shell that shows the sources instead of a list of offers. Front only: the API
 * never lists offers for it.
 */
export const SOURCES_TAB = 'sources';

/**
 * How long the "N new offers" message stays in place of the sync time.
 */
export const REFRESH_MESSAGE_MS = 6000;

/**
 * Counts shown before the first response.
 */
export const NO_COUNTS: JobCounts = { local: 0, remote: 0, favorites: 0 };
