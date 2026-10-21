import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AppConfigApi } from './app-config-api';

describe('AppConfigApi', () => {
  let http: HttpTestingController;
  let api: AppConfigApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(AppConfigApi);
  });

  afterEach(() => http.verify());

  it('asks once and shares the answer with every caller', async () => {
    const first = api.load();
    const second = api.load();
    http.expectOne('/api/config').flush({ areaLabel: 'Normandie', authRequired: true });

    expect(await first).toEqual({ areaLabel: 'Normandie', authRequired: true });
    expect(await second).toEqual({ areaLabel: 'Normandie', authRequired: true });
    expect(api.areaLabel()).toBe('Normandie');
  });

  it('answers null when the API cannot be reached, and asks again next time', async () => {
    const failed = api.load();
    http.expectOne('/api/config').flush(null, { status: 0, statusText: 'Unknown' });
    expect(await failed).toBeNull();
    expect(api.areaLabel()).toBeNull();

    const retried = api.load();
    http.expectOne('/api/config').flush({ areaLabel: 'Normandie', authRequired: false });
    expect(await retried).not.toBeNull();
  });
});
