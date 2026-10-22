import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import { useCleanStorage } from '@core/storage/storage.fixtures';

import { authInterceptor } from './auth.interceptor';
import { AuthSession } from './auth-session';

describe('authInterceptor', () => {
  useCleanStorage();

  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    localStorage.setItem('job-finder-token', 'token-1');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => http.verify());

  it('sends the token to the API only', () => {
    void firstValueFrom(client.get('/api/jobs'));
    void firstValueFrom(client.get('/assets/icons/star.svg'));

    expect(http.expectOne('/api/jobs').request.headers.get('x-app-token')).toBe('token-1');
    expect(http.expectOne('/assets/icons/star.svg').request.headers.has('x-app-token')).toBe(false);
  });

  it('drops a refused token and goes back to the login screen', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const call = firstValueFrom(client.get('/api/jobs')).catch(() => null);
    http.expectOne('/api/jobs').flush(null, { status: 401, statusText: 'Unauthorized' });
    await call;

    expect(TestBed.inject(AuthSession).signedIn()).toBe(false);
    expect(localStorage.getItem('job-finder-token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('remembers the page the reader was on', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/offres/job-1');
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const call = firstValueFrom(client.get('/api/jobs')).catch(() => null);
    http.expectOne('/api/jobs').flush(null, { status: 401, statusText: 'Unauthorized' });
    await call;

    expect(navigate).toHaveBeenCalledWith('/login?returnUrl=%2Foffres%2Fjob-1');
  });

  it('leaves a wrong password to the login screen', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const call = firstValueFrom(client.post('/api/auth/login', {})).catch(() => null);
    http.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    await call;

    expect(TestBed.inject(AuthSession).signedIn()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
