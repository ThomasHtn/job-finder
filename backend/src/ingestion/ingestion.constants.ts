/**
 * Name of the cron job in the Nest scheduler registry.
 */
export const CRON_JOB_NAME = 'ingestion';

/**
 * Time zone of the cron expression, as documented: UTC, whatever the server's own clock says.
 */
export const CRON_TIME_ZONE = 'UTC';

/**
 * Finished runs listed per source in the sources tab.
 */
export const RECENT_RUNS = 10;

/**
 * A push monitor that does not answer within this delay is given up on, the run is not held.
 */
export const HEARTBEAT_TIMEOUT_MS = 10_000;

/**
 * Longest heartbeat message: enough for a few source errors, short enough for an alert.
 */
export const HEARTBEAT_MSG_MAX = 250;

/**
 * Stands for the city of a remote offer in the similarity key.
 */
export const REMOTE_PLACE = 'remote';

/**
 * Marks the end of a text cut short.
 */
export const TRUNCATION_MARK = '...';

/**
 * Longest error kept per failed source in the message.
 */
export const HEARTBEAT_ERROR_MAX = 60;

/**
 * Columns of an existing offer that a merge reads.
 */
export const MERGE_COLUMNS = {
  id: true,
  url: true,
  sourceLabel: true,
  hasFullDescription: true,
  alternativeUrls: true,
  publishedAt: true,
} as const;
