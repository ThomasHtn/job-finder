import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LOCALE_STORAGE_KEY } from '@core/i18n/i18n.constants';
import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { Language } from '@core/i18n/language';
import { ingestionSummary } from '@core/ingestion/ingestion.fixtures';
import { useCleanStorage } from '@core/storage/storage.fixtures';
import { settle } from '@core/testing/testing.fixtures';

import { REFRESH_MESSAGE_MS } from './jobs.constants';
import { JobsRefresh } from './jobs-refresh';
import { SourceHealth } from './source-health';

describe('JobsRefresh', () => {
  useFrenchTexts();
  useCleanStorage();

  let http: HttpTestingController;
  let refresh: JobsRefresh;

  beforeEach(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    TestBed.configureTestingModule({
      providers: [JobsRefresh, SourceHealth, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    refresh = TestBed.inject(JobsRefresh);
    TestBed.inject(SourceHealth).statuses();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  /**
   * Answers the first status read the health makes on creation, so only the refresh's calls remain.
   */
  async function answerFirstStatus(): Promise<void> {
    await settle();
    http.expectOne('/api/ingestion/status').flush([]);
    await settle();
  }

  it('tells what a refresh brought, asks for the list again and reloads the health', async () => {
    await answerFirstStatus();
    const running = refresh.run();
    expect(refresh.running()).toBe(true);
    http.expectOne('/api/ingestion/run').flush(ingestionSummary(2));
    await settle();

    expect(await running).toBe(true);
    expect(refresh.running()).toBe(false);
    expect(refresh.message()).toBe('2 nouvelles offres.');
    expect(refresh.warning()).toBeNull();
    http.expectOne('/api/ingestion/status').flush([]);
  });

  it('names the sources that failed', async () => {
    await answerFirstStatus();
    const running = refresh.run();
    http.expectOne('/api/ingestion/run').flush(ingestionSummary(0, ['FREE_WORK']));
    await running;

    expect(refresh.warning()).toBe('Source(s) indisponible(s) : Free-Work.');
    await settle();
    http.expectOne('/api/ingestion/status').flush([]);
  });

  it('says a search is already running, and has no new offers to show', async () => {
    await answerFirstStatus();
    const running = refresh.run();
    http
      .expectOne('/api/ingestion/run')
      .flush(
        { status: 409, code: 'CONFLICT', detail: 'running' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(await running).toBe(false);
    expect(refresh.message()).toBe('Une recherche est déjà en cours.');
  });

  it('throws any other failure for the caller to show', async () => {
    await answerFirstStatus();
    const running = refresh.run();
    http.expectOne('/api/ingestion/run').flush(null, { status: 500, statusText: 'Error' });

    await expect(running).rejects.toBeDefined();
    expect(refresh.running()).toBe(false);
    expect(refresh.message()).toBeNull();
  });

  it('follows a language switch', async () => {
    await answerFirstStatus();
    const running = refresh.run();
    http.expectOne('/api/ingestion/run').flush(ingestionSummary(1));
    await running;
    await settle();
    http.expectOne('/api/ingestion/status').flush([]);
    expect(refresh.message()).toBe('1 nouvelle offre.');

    await TestBed.inject(Language).use('en');

    expect(refresh.message()).toBe('1 new offer.');
  });

  it('forgets the message after a few seconds', async () => {
    await answerFirstStatus();
    vi.useFakeTimers();
    const running = refresh.run();
    http.expectOne('/api/ingestion/run').flush(ingestionSummary(1));
    await vi.advanceTimersByTimeAsync(0);
    await running;
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('/api/ingestion/status').flush([]);
    expect(refresh.message()).not.toBeNull();

    vi.advanceTimersByTime(REFRESH_MESSAGE_MS);

    expect(refresh.message()).toBeNull();
  });
});
