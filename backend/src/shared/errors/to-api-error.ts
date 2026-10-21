import { HttpException, HttpStatus } from '@nestjs/common';

import { API_ERROR_CODES, type ApiError, type ApiErrorCode } from '@job-finder/contract';

/**
 * Code answered for each status the API throws; any other 4xx is a bad request, any 5xx internal.
 */
const CODE_BY_STATUS: Partial<Record<number, ApiErrorCode>> = {
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

/**
 * Renders anything thrown by a route as the API error body.
 * A thrower may pick the code itself, e.g. `new ServiceUnavailableException({ code: 'NO_PASSWORD', message })`.
 */
export function toApiError(exception: unknown): ApiError {
  if (!(exception instanceof HttpException)) {
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL', detail: INTERNAL_DETAIL };
  }

  const status = exception.getStatus();
  const code =
    chosenCode(exception.getResponse()) ??
    CODE_BY_STATUS[status] ??
    (status >= 500 ? 'INTERNAL' : 'BAD_REQUEST');
  return { status, code, detail: code === 'INTERNAL' ? INTERNAL_DETAIL : exception.message };
}

/**
 * The code a thrower passed in its response object, if it is a known one.
 */
function chosenCode(response: string | object): ApiErrorCode | undefined {
  if (typeof response !== 'object' || !('code' in response)) return undefined;
  const code = response.code as ApiErrorCode;
  return API_ERROR_CODES.includes(code) ? code : undefined;
}
