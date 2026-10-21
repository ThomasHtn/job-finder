/**
 * Name of the cron job in the Nest scheduler registry.
 */
export const CRON_JOB_NAME = 'ingestion';

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
 * Longest error kept per failed source in the message.
 */
export const HEARTBEAT_ERROR_MAX = 60;
