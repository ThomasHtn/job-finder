import type { JobCounts } from '@job-finder/shared';

/**
 * How long the "N new offers" message stays next to the timestamp.
 */
export const REFRESH_MESSAGE_MS = 6000;

/**
 * Label of the on-site tab until the config arrives.
 */
export const AREA_LABEL_PLACEHOLDER = 'Sur site';

/**
 * Counts shown before the first response.
 */
export const NO_COUNTS: JobCounts = { local: 0, remote: 0, favorites: 0 };
