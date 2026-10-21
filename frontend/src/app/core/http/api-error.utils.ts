import { HttpErrorResponse } from '@angular/common/http';

import { translate } from '@jsverse/transloco';

import { API_ERROR_CODES, type ApiErrorCode } from '@job-finder/contract';

import { STATUS_ERROR_CODES } from './api-error.constants';

/**
 * Error code of a failed call: the one the body names, else the one its status implies, so an answer
 * from a proxy or an older API reads the same way. `null` for anything that is not an HTTP failure.
 */
export function apiErrorCode(error: unknown): ApiErrorCode | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }
  return codeFromBody(error.error) ?? codeFromStatus(error.status);
}

/**
 * What went wrong with a call, in the active language, to append to the message naming the action.
 */
export function describeHttpError(error: unknown): string {
  const status = error instanceof HttpErrorResponse ? error.status : 0;
  switch (apiErrorCode(error)) {
    case null:
    case 'UNAVAILABLE':
      return translate('errors.unreachable');
    case 'INTERNAL':
    case 'NO_PASSWORD':
      return translate('errors.serverError');
    case 'TIMEOUT':
      return translate('errors.timeout');
    case 'CONFLICT':
      return translate('errors.conflict');
    default:
      return translate('errors.status', { status });
  }
}

/**
 * Whether a call failed with a 404, which no retry would fix.
 */
export function isNotFound(error: unknown): boolean {
  return apiErrorCode(error) === 'NOT_FOUND';
}

/**
 * Code named by an `ApiError` body, `null` when the body is not one or the code is unknown.
 */
function codeFromBody(body: unknown): ApiErrorCode | null {
  if (typeof body !== 'object' || body === null || !('code' in body)) {
    return null;
  }
  const code = body.code;
  return API_ERROR_CODES.find((known) => known === code) ?? null;
}

/**
 * Code a bare status implies: the known ones from the table, any other 5xx an internal error.
 */
function codeFromStatus(status: number): ApiErrorCode {
  return STATUS_ERROR_CODES.get(status) ?? (status >= 500 ? 'INTERNAL' : 'BAD_REQUEST');
}
