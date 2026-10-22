import { HttpException, HttpStatus } from '@nestjs/common';

import { API_ERROR_CODES, type ApiError, type ApiErrorCode } from '@job-finder/contract';

import { CODE_BY_STATUS, INTERNAL_DETAIL } from './to-api-error.constants.js';

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
