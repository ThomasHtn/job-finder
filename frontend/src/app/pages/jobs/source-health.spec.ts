import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { SourceStatus } from '@job-finder/contract';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { settle } from '@core/testing/testing.fixtures';

import { SourceHealth } from './source-health';

/**
 * Health of one source: enabled, and up unless `ok` says otherwise.
 */
function status(source: SourceStatus['source'], ok: boolean, enabled = true): SourceStatus {
  return {
    source,
    enabled,
    ok,
    lastRunAt: '2026-10-21T10:00:00.000Z',
    error: ok ? null : 'timeout',
    lastSuccessAt: null,
    jobCount: 0,
    runs: [],
  };
}

describe('SourceHealth', () => {
  useFrenchTexts();

  let http: HttpTestingController;
  let health: SourceHealth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SourceHealth, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    health = TestBed.inject(SourceHealth);
  });

  afterEach(() => http.verify());

  /**
   * Answers the pending status request.
   */
  async function answer(statuses: SourceStatus[]): Promise<void> {
    await settle();
    http.expectOne('/api/ingestion/status').flush(statuses);
    await settle();
  }

  it('counts the enabled sources and names the failing ones as the reader knows them', async () => {
    await answer([status('ATS', true), status('FREE_WORK', false), status('ADZUNA', false, false)]);

    expect(health.degraded()).toBe(true);
    expect(health.label()).toBe('1/2 sources disponibles - en échec : Free-Work');
  });

  it('stays quiet while every enabled source is up', async () => {
    await answer([status('ATS', true), status('APEC', true)]);

    expect(health.degraded()).toBe(false);
    expect(health.label()).toBe('2/2 sources disponibles');
  });

  it('flags a status request that failed, keeping the last statuses', async () => {
    await answer([status('ATS', true)]);
    expect(health.statuses()).toHaveLength(1);

    health.refresh();
    await settle();
    http.expectOne('/api/ingestion/status').flush(null, { status: 500, statusText: 'Error' });
    await settle();

    expect(health.failed()).toBe(true);
    expect(health.statuses()).toHaveLength(1);
  });
});
