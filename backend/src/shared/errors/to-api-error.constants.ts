import { HttpStatus } from '@nestjs/common';

import type { ApiErrorCode } from '@job-finder/contract';

/**
 * Code answered for each status the API throws; any other 4xx is a bad request, any 5xx internal.
 */
export const CODE_BY_STATUS: Partial<Record<number, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'UNAVAILABLE',
};

/**
 * Detail of an unexpected failure: the real cause goes to the logs, never to the client.
 */
export const INTERNAL_DETAIL = 'Unexpected server error';
