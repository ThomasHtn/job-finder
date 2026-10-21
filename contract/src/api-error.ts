/**
 * Codes the API answers with, a promise to the front: renaming one breaks the screens that read it.
 */
export const API_ERROR_CODES = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'CONFLICT',
  'TOO_MANY_REQUESTS',
  'NO_PASSWORD',
  'UNAVAILABLE',
  'TIMEOUT',
  'INTERNAL',
] as const;

/**
 * One of the error codes of the API.
 */
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/**
 * Body of every error response, from the API or from nginx when the API is down.
 */
export interface ApiError {
  /**
   * HTTP status, repeated so a logged body still tells it.
   */
  status: number;

  /**
   * Stable machine-readable reason, translated by the front.
   */
  code: ApiErrorCode;

  /**
   * English explanation for whoever reads the logs, never shown as is.
   */
  detail: string;
}
