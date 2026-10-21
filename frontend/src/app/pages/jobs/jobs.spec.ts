import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import type { IngestionSummary, SourceStatus } from '@job-finder/contract';

import { LOCALE_STORAGE_KEY } from '@core/i18n/i18n.constants';
import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { jobList, jobSummary } from '@core/jobs/job.fixtures';
import { JobPatchBus } from '@core/jobs/job-patch-bus';
import { LAST_VISIT_STORAGE_KEY } from '@core/jobs/jobs.constants';
import { useCleanStorage } from '@core/storage/storage.fixtures';
import { settle } from '@core/testing/testing.fixtures';

import { JobsPage } from './jobs';

/**
 * A manual refresh that found `inserted` offers, with the given sources down.
 */
function ingestion(inserted: number, failedSources: string[] = []): IngestionSummary {
  return {
    fetched: inserted,
    kept: inserted,
    inserted,
    updated: 0,
    merged: 0,
    purged: 0,
    skippedSources: [],
    failedSources,
  };
}

/**
 * Stands in for the detail page, which this spec does not render.
 */
@Component({ selector: 'app-detail-stub', template: '' })
class DetailStub {}

/**
 * Feed rendering and its round trips with the API.
 */
describe('JobsPage', () => {
  useFrenchTexts();
  useCleanStorage();

  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /**
   * Mounts the page on a tab and answers the config and status calls it fires on boot.
   */
  async function create(tab?: string, statuses: SourceStatus[] = []) {
    const fixture = TestBed.createComponent(JobsPage);
    if (tab) {
      fixture.componentRef.setInput('tab', tab);
    }
    await settle(fixture);
    http.expectOne('/api/config').flush({ areaLabel: 'Seine-Maritime', authRequired: false });
    http.expectOne('/api/ingestion/status').flush(statuses);
    return fixture;
  }

  /**
   * Answers the pending list request.
   */
  async function answerList(fixture: ComponentFixture<JobsPage>, jobs = [jobSummary()]) {
    http.expectOne((request) => request.url === '/api/jobs').flush(jobList(jobs));
    await settle(fixture);
  }

  /**
   * Text of the rendered page.
   */
  function text(fixture: ComponentFixture<JobsPage>): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  /**
   * The first element matching `selector`.
   */
  function find<T extends HTMLElement>(fixture: ComponentFixture<JobsPage>, selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(selector)!;
  }

  it('loads the local tab by default and renders rows like the France Travail feed', async () => {
    const fixture = await create();

    const request = http.expectOne((req) => req.url === '/api/jobs');
    expect(request.request.params.get('tab')).toBe('local');
    request.flush(jobList([jobSummary()]));
    await settle(fixture);

    expect(text(fixture)).toContain('Seine-Maritime');
    expect(text(fixture)).toContain('Développeur Angular');
    expect(text(fixture)).toContain('Acme');
    expect(text(fixture)).toContain('76 - Le Havre');
    expect(text(fixture)).toContain('Un extrait de la description.');
    expect(text(fixture)).toContain("Aujourd'hui");
    expect(text(fixture)).toContain('France Travail');
    expect(find(fixture, 'a.job-row__title').getAttribute('href')).toBe('/offres/job-1');
  });

  it('follows the tab given in the URL', async () => {
    const fixture = await create('remote');

    const request = http.expectOne((req) => req.url === '/api/jobs');
    expect(request.request.params.get('tab')).toBe('remote');
    request.flush(jobList([jobSummary({ isRemote: true, city: null })]));
    await settle(fixture);

    expect(text(fixture)).toContain('Full remote');
  });

  it('flags region-only offers', async () => {
    const fixture = await create();
    await answerList(fixture, [
      jobSummary({ city: 'Seine-Maritime', postalCode: null, isLocationApproximate: true }),
    ]);

    expect(text(fixture)).toContain('commune non précisée');
  });

  it('toggles the favourite from the star and reloads', async () => {
    const fixture = await create();
    await answerList(fixture);

    find<HTMLButtonElement>(fixture, '.job-row__star').click();
    http.expectOne('/api/jobs/job-1/favorite').flush(jobSummary({ isFavorite: true }));
    await settle(fixture);
    await answerList(fixture, [jobSummary({ isFavorite: true })]);

    expect(find(fixture, '.job-row__star').getAttribute('aria-label')).toBe('Retirer des favoris');
  });

  it('triggers a manual ingestion run and reloads the list from the refresh button', async () => {
    const fixture = await create();
    await answerList(fixture);

    find<HTMLButtonElement>(fixture, '.jobs__refresh').click();
    const run = http.expectOne('/api/ingestion/run');
    expect(run.request.method).toBe('POST');
    run.flush(ingestion(1));
    await settle(fixture);

    await answerList(fixture, [jobSummary(), jobSummary({ id: 'job-2' })]);
    http.expectOne('/api/ingestion/status').flush([]);
    await settle(fixture);

    expect(text(fixture)).toContain('Développeur Angular');
    expect(text(fixture)).toContain('1 nouvelle offre.');
  });

  it('hides an offer and reloads the list', async () => {
    const fixture = await create();
    await answerList(fixture);

    find<HTMLButtonElement>(fixture, '.job-row__hide').click();
    http.expectOne('/api/jobs/job-1/hide').flush(jobSummary());
    await settle(fixture);
    await answerList(fixture, []);

    expect(text(fixture)).toContain("Aucune offre pour l'instant.");
  });

  it('flags a failed source after a manual refresh', async () => {
    const fixture = await create();
    await answerList(fixture);

    find<HTMLButtonElement>(fixture, '.jobs__refresh').click();
    http.expectOne('/api/ingestion/run').flush(ingestion(0, ['FREE_WORK']));
    await settle(fixture);
    await answerList(fixture);
    http.expectOne('/api/ingestion/status').flush([]);
    await settle(fixture);

    expect(text(fixture)).toContain('Source(s) indisponible(s) : Free-Work.');
  });

  it('says why a manual refresh failed, and keeps the list in place', async () => {
    const fixture = await create();
    await answerList(fixture);

    find<HTMLButtonElement>(fixture, '.jobs__refresh').click();
    http.expectOne('/api/ingestion/run').flush(null, { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    expect(find(fixture, 'app-notice').textContent).toContain(
      'Impossible de récupérer de nouvelles offres.',
    );
    expect(text(fixture)).toContain('Développeur Angular');
  });

  it('says a search is already running instead of failing', async () => {
    const fixture = await create();
    await answerList(fixture);

    find<HTMLButtonElement>(fixture, '.jobs__refresh').click();
    http
      .expectOne('/api/ingestion/run')
      .flush(
        { status: 409, code: 'CONFLICT', detail: 'running' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle(fixture);

    expect(text(fixture)).toContain('Une recherche est déjà en cours.');
    expect(fixture.nativeElement.querySelector('app-notice')).toBeNull();
  });

  it('says why a star failed, and keeps the row as it was', async () => {
    const fixture = await create();
    await answerList(fixture);

    find<HTMLButtonElement>(fixture, '.job-row__star').click();
    http.expectOne('/api/jobs/job-1/favorite').flush(null, { status: 0, statusText: 'Unknown' });
    await settle(fixture);

    expect(find(fixture, 'app-notice').textContent).toContain('Impossible de modifier le favori.');
    expect(find(fixture, '.job-row__star').getAttribute('aria-pressed')).toBe('false');
  });

  it('says why hiding failed', async () => {
    const fixture = await create();
    await answerList(fixture);

    find<HTMLButtonElement>(fixture, '.job-row__hide').click();
    http.expectOne('/api/jobs/job-1/hide').flush(null, { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    expect(find(fixture, 'app-notice').textContent).toContain("Impossible de masquer l'offre.");
  });

  it('marks the refresh button and warns when a source is down', async () => {
    const down: SourceStatus = {
      source: 'FREE_WORK',
      enabled: true,
      lastRunAt: '2026-09-08T10:00:00.000Z',
      ok: false,
      error: 'timeout',
      lastSuccessAt: null,
      jobCount: 0,
      runs: [],
    };
    const fixture = await create(undefined, [down]);
    await answerList(fixture);

    expect(find(fixture, '.jobs__refresh').classList).toContain('jobs__refresh--degraded');
    expect(text(fixture)).toContain('0/1 sources disponibles - en échec : Free-Work');
  });

  it('narrows the feed to the offers new since the last visit', async () => {
    localStorage.setItem(LAST_VISIT_STORAGE_KEY, '2026-09-05T00:00:00.000Z');
    const fixture = await create();
    await answerList(fixture, [
      jobSummary({ id: 'old', title: 'Ancienne', firstSeenAt: '2026-09-01T00:00:00.000Z' }),
      jobSummary({ id: 'new', title: 'Nouvelle', firstSeenAt: '2026-09-06T00:00:00.000Z' }),
    ]);

    expect(text(fixture)).toContain('offre depuis votre dernière visite');
    find<HTMLButtonElement>(fixture, '.jobs__fresh').click();
    await settle(fixture);

    expect(text(fixture)).toContain('Nouvelle');
    expect(text(fixture)).not.toContain('Ancienne');
  });

  it('patches a row changed in the panel without reloading', async () => {
    const fixture = await create();
    await answerList(fixture);

    TestBed.inject(JobPatchBus).publish(jobSummary({ isFavorite: true, isViewed: true }));
    await settle(fixture);

    expect(find(fixture, 'app-job-row').classList).toContain('job-row--viewed');
    expect(text(fixture)).toContain('1');
  });

  it('shows the sources board on its tab', async () => {
    const fixture = await create('sources');
    await answerList(fixture);

    expect(fixture.nativeElement.querySelector('app-source-board')).not.toBeNull();
  });

  it('renders the whole shell in the language picked from the header', async () => {
    const fixture = await create();
    await answerList(fixture);

    expect(text(fixture)).toContain('Favoris');

    find<HTMLButtonElement>(fixture, '.language-toggle__button').click();
    await settle(fixture);

    expect(text(fixture)).toContain('Favorites');
    expect(text(fixture)).not.toContain('Favoris');
    expect(find(fixture, '.jobs__refresh').getAttribute('aria-label')).toBe(
      'Search for new offers',
    );
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('shows a message when the API fails, and retries the list', async () => {
    const fixture = await create();
    http
      .expectOne((req) => req.url === '/api/jobs')
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    expect(text(fixture)).toContain('Impossible de charger les offres');
    find<HTMLButtonElement>(fixture, 'app-empty-state button').click();
    await settle(fixture);
    await answerList(fixture);
    expect(text(fixture)).not.toContain('Impossible');
  });

  it('marks the row of the offer the URL has open', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: JobsPage,
            children: [{ path: 'offres/:id', component: DetailStub }],
          },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create('/offres/job-2');
    http.expectOne('/api/config').flush({ areaLabel: 'Seine-Maritime', authRequired: false });
    http.expectOne('/api/ingestion/status').flush([]);
    http
      .expectOne((request) => request.url === '/api/jobs')
      .flush(jobList([jobSummary(), jobSummary({ id: 'job-2', title: 'Ouverte' })]));
    await settle(harness.fixture);

    const selected = harness.routeNativeElement?.querySelectorAll('.job-row--selected');
    expect(selected).toHaveLength(1);
    expect(selected?.[0].textContent).toContain('Ouverte');
  });
});
