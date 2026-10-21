import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { useCleanStorage } from '@core/storage/storage.fixtures';

import { TOKEN_STORAGE_KEY } from './auth.constants';
import { AuthSession } from './auth-session';

describe('AuthSession', () => {
  useCleanStorage();

  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('picks up the token kept by a previous visit', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'token-1');

    const session = TestBed.inject(AuthSession);

    expect(session.token()).toBe('token-1');
    expect(session.signedIn()).toBe(true);
  });

  it('exchanges the password for a token and keeps it across reloads', async () => {
    const session = TestBed.inject(AuthSession);

    const signIn = session.signIn('secret');
    const request = http.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({ password: 'secret' });
    request.flush({ token: 'token-2' });
    await signIn;

    expect(session.signedIn()).toBe(true);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('token-2');
  });

  it('keeps nothing when the password is refused', async () => {
    const session = TestBed.inject(AuthSession);

    const signIn = session.signIn('nope');
    http.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(signIn).rejects.toBeTruthy();
    expect(session.signedIn()).toBe(false);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('forgets the token on sign-out', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'token-1');
    const session = TestBed.inject(AuthSession);

    session.signOut();

    expect(session.signedIn()).toBe(false);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
