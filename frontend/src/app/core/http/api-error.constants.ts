import { HttpStatusCode } from '@angular/common/http';

import type { ApiErrorCode } from '@job-finder/contract';

/**
 * Code a bare status implies when the body names none: no answer or a bad gateway mean the API is
 * down, a gateway timeout that it is up but slow.
 */
export const STATUS_ERROR_CODES: ReadonlyMap<number, ApiErrorCode> = new Map([
  [0, 'UNAVAILABLE'],
  [HttpStatusCode.BadGateway, 'UNAVAILABLE'],
  [HttpStatusCode.GatewayTimeout, 'TIMEOUT'],
  [HttpStatusCode.BadRequest, 'BAD_REQUEST'],
  [HttpStatusCode.Unauthorized, 'UNAUTHORIZED'],
  [HttpStatusCode.NotFound, 'NOT_FOUND'],
  [HttpStatusCode.Conflict, 'CONFLICT'],
  [HttpStatusCode.TooManyRequests, 'TOO_MANY_REQUESTS'],
]);
