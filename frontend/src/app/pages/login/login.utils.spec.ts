import { HttpErrorResponse } from '@angular/common/http';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { loginErrorMessage } from './login.utils';

describe('loginErrorMessage', () => {
  useFrenchTexts();

  it('asks to wait after too many attempts', () => {
    const error = new HttpErrorResponse({ status: 429 });
    expect(loginErrorMessage(error)).toBe('Trop de tentatives, réessayez dans quelques minutes.');
  });

  it('says the password is wrong on a 401', () => {
    expect(loginErrorMessage(new HttpErrorResponse({ status: 401 }))).toBe(
      'Mot de passe incorrect.',
    );
  });

  it('says the API is down rather than blaming the password', () => {
    const down = new HttpErrorResponse({
      status: 503,
      error: { status: 503, code: 'UNAVAILABLE', detail: 'down' },
    });
    expect(loginErrorMessage(down)).toBe("L'API est-elle démarrée ?");
    expect(loginErrorMessage(new HttpErrorResponse({ status: 0 }))).toBe(
      "L'API est-elle démarrée ?",
    );
  });

  it('reports any other failure as it is', () => {
    expect(loginErrorMessage(new HttpErrorResponse({ status: 400 }))).toBe('Erreur 400.');
  });
});
