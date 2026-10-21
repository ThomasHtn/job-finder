import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { useCleanStorage } from '@core/storage/storage.fixtures';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  useCleanStorage();

  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('sends a visitor without a token to the login screen when the API asks for a password', async () => {
    const fixture = TestBed.createComponent(App);
    const navigation = TestBed.inject(Router).navigateByUrl('/');
    await new Promise((resolve) => setTimeout(resolve));
    http.expectOne('/api/config').flush({ areaLabel: 'Normandie', authRequired: true });
    await navigation;
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/login');
  });
});
