import { translate } from '@jsverse/transloco';

import { apiErrorCode, describeHttpError } from '@core/http/api-error.utils';

/**
 * Why a login failed, in the active language: a wrong password and the throttle get their own words,
 * anything else (API down, network, server error) says what actually went wrong.
 */
export function loginErrorMessage(error: unknown): string {
  switch (apiErrorCode(error)) {
    case 'UNAUTHORIZED':
      return translate('login.wrongPassword');
    case 'TOO_MANY_REQUESTS':
      return translate('login.throttled');
    default:
      return describeHttpError(error);
  }
}
