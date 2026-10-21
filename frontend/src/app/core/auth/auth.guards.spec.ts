import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { useCleanStorage } from '@core/storage/storage.fixtures';

import { authGuard } from './auth.guards';

describe('authGuard', () => {
  useCleanStorage();

  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /**
   * Runs the guard as the router would.
   */
  function run(): Promise<unknown> {
    return TestBed.runInInjectionContext(
      () => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Promise<unknown>,
    );
  }

  it('lets a reader holding a token through without asking the API', async () => {
    localStorage.setItem('job-finder-token', 'token-1');
    expect(await run()).toBe(true);
  });

  it('sends to the login screen when a password is required', async () => {
    const result = run();
    await new Promise((resolve) => setTimeout(resolve));
    http.expectOne('/api/config').flush({ areaLabel: 'Normandie', authRequired: true });

    expect(((await result) as UrlTree).toString()).toBe('/login');
  });

  it('lets the page load when no password is set or the API is out of reach', async () => {
    const open = run();
    await new Promise((resolve) => setTimeout(resolve));
    http.expectOne('/api/config').flush({ areaLabel: 'Normandie', authRequired: false });
    expect(await open).toBe(true);
  });

  it('lets the page load when the API is out of reach, and asks again next time', async () => {
    const first = run();
    await new Promise((resolve) => setTimeout(resolve));
    http.expectOne('/api/config').flush(null, { status: 502, statusText: 'Bad Gateway' });
    expect(await first).toBe(true);

    const second = run();
    await new Promise((resolve) => setTimeout(resolve));
    http.expectOne('/api/config').flush({ areaLabel: 'Normandie', authRequired: false });
    expect(await second).toBe(true);
  });
});
