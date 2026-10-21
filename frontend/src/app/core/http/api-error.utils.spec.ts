import { HttpErrorResponse } from '@angular/common/http';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { apiErrorCode, describeHttpError, isNotFound } from './api-error.utils';

/**
 * A failed call with the given status and body.
 */
function failure(status: number, error: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('api error utils', () => {
  useFrenchTexts();

  it('reads the code an ApiError body names', () => {
    expect(apiErrorCode(failure(503, { status: 503, code: 'NO_PASSWORD', detail: '' }))).toBe(
      'NO_PASSWORD',
    );
  });

  it('derives the code from the status when the body names none', () => {
    expect(apiErrorCode(failure(0))).toBe('UNAVAILABLE');
    expect(apiErrorCode(failure(502))).toBe('UNAVAILABLE');
    expect(apiErrorCode(failure(401))).toBe('UNAUTHORIZED');
    expect(apiErrorCode(failure(429, { code: 'SOMETHING_ELSE' }))).toBe('TOO_MANY_REQUESTS');
    expect(apiErrorCode(failure(500, 'Internal Server Error'))).toBe('INTERNAL');
    expect(apiErrorCode(failure(409))).toBe('CONFLICT');
    expect(apiErrorCode(failure(418))).toBe('BAD_REQUEST');
  });

  it('ignores anything that is not an HTTP failure', () => {
    expect(apiErrorCode(new Error('boom'))).toBeNull();
    expect(isNotFound(new Error('boom'))).toBe(false);
  });

  it('tells a missing offer apart', () => {
    expect(isNotFound(failure(404))).toBe(true);
    expect(isNotFound(failure(500))).toBe(false);
  });

  it('says what went wrong, in French by default', () => {
    expect(describeHttpError(failure(0))).toBe("L'API est-elle démarrée ?");
    expect(
      describeHttpError(failure(503, { status: 503, code: 'UNAVAILABLE', detail: 'down' })),
    ).toBe("L'API est-elle démarrée ?");
    expect(describeHttpError(failure(500))).toBe(
      'Le serveur a rencontré une erreur, réessayez plus tard.',
    );
    expect(describeHttpError(failure(403))).toBe('Erreur 403.');
  });

  it('tells a slow server from a stopped one', () => {
    const slow = "Le serveur met du temps à répondre, l'opération continue peut-être.";
    expect(describeHttpError(failure(504, { status: 504, code: 'TIMEOUT', detail: 'slow' }))).toBe(
      slow,
    );
    expect(describeHttpError(failure(504))).toBe(slow);
    expect(describeHttpError(failure(502))).toBe("L'API est-elle démarrée ?");
  });

  it('says a search is already running', () => {
    expect(describeHttpError(failure(409, { status: 409, code: 'CONFLICT', detail: '' }))).toBe(
      'Une recherche est déjà en cours.',
    );
  });
});
