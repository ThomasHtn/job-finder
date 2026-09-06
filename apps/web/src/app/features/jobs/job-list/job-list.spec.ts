import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { JobListResponse, JobSummary } from '@job-finder/shared';
import { JobList } from './job-list';

function summary(overrides: Partial<JobSummary> = {}): JobSummary {
  return {
    id: 'job-1',
    title: 'Développeur Angular',
    company: 'Acme',
    city: 'Le Havre',
    postalCode: '76600',
    isRemote: false,
    isLocationApproximate: false,
    source: 'FRANCE_TRAVAIL',
    sourceLabel: 'France Travail',
    url: 'https://example.test/offer',
    hasFullDescription: true,
    contractLabel: 'CDI',
    salary: null,
    excerpt: 'Un extrait de la description.',
    isFavorite: false,
    isViewed: false,
    publishedAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    alternativeUrls: [],
    ...overrides,
  };
}

function response(jobs: JobSummary[]): JobListResponse {
  return {
    jobs,
    counts: { local: jobs.length, remote: 0, favorites: 0 },
    lastIngestionAt: '2026-09-03T10:00:00.000Z',
  };
}

describe('JobList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function create(tab?: string) {
    const fixture = TestBed.createComponent(JobList);
    if (tab) fixture.componentRef.setInput('tab', tab);
    fixture.detectChanges();
    http.expectOne('/api/config').flush({ areaLabel: 'Seine-Maritime', authRequired: false });
    http.expectOne('/api/ingestion/status').flush([]);
    return fixture;
  }

  it('loads the local tab by default and renders rows like the France Travail feed', () => {
    const fixture = create();

    const request = http.expectOne((req) => req.url === '/api/jobs');
    expect(request.request.params.get('tab')).toBe('local');
    request.flush(response([summary()]));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Seine-Maritime');
    expect(text).toContain('Développeur Angular');
    expect(text).toContain('Acme');
    expect(text).toContain('76 - Le Havre');
    expect(text).toContain('Un extrait de la description.');
    expect(text).toContain("Aujourd'hui");
    expect(text).toContain('France Travail');

    const link = fixture.nativeElement.querySelector('a.job-row__title') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/offres/job-1');
  });

  it('follows the tab given in the URL', () => {
    const fixture = create('remote');

    const request = http.expectOne((req) => req.url === '/api/jobs');
    expect(request.request.params.get('tab')).toBe('remote');
    request.flush(response([summary({ isRemote: true, city: null })]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Full remote');
  });

  it('flags region-only offers', () => {
    const fixture = create();
    http
      .expectOne((req) => req.url === '/api/jobs')
      .flush(
        response([
          summary({ city: 'Seine-Maritime', postalCode: null, isLocationApproximate: true }),
        ]),
      );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('commune non précisée');
  });

  it('toggles the favourite from the star and reloads', () => {
    const fixture = create();
    http.expectOne((req) => req.url === '/api/jobs').flush(response([summary()]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.job-row__star') as HTMLButtonElement).click();
    http.expectOne('/api/jobs/job-1/favorite').flush(summary({ isFavorite: true }));
    http
      .expectOne((req) => req.url === '/api/jobs')
      .flush(response([summary({ isFavorite: true })]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.job-row__star').getAttribute('aria-label')).toBe(
      'Retirer des favoris',
    );
  });

  it('triggers a manual ingestion run and reloads the list from the refresh button', () => {
    const fixture = create();
    http.expectOne((req) => req.url === '/api/jobs').flush(response([summary()]));
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Rechercher de nouvelles offres"]',
      ) as HTMLButtonElement
    ).click();

    const ingestion = http.expectOne('/api/ingestion/run');
    expect(ingestion.request.method).toBe('POST');
    ingestion.flush({
      fetched: 1,
      kept: 1,
      inserted: 1,
      updated: 0,
      merged: 0,
      purged: 0,
      skippedSources: [],
      failedSources: [],
    });

    http
      .expectOne((req) => req.url === '/api/jobs')
      .flush(response([summary(), summary({ id: 'job-2' })]));
    http.expectOne('/api/ingestion/status').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Développeur Angular');
    expect(fixture.nativeElement.textContent).toContain('nouvelle offre');
  });

  it('hides an offer and reloads the list', () => {
    const fixture = create();
    http.expectOne((req) => req.url === '/api/jobs').flush(response([summary()]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.job-row__hide') as HTMLButtonElement).click();
    http.expectOne('/api/jobs/job-1/hide').flush(summary());
    http.expectOne((req) => req.url === '/api/jobs').flush(response([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Aucune offre pour l'instant.");
  });

  it('flags a failed source after a manual refresh', () => {
    const fixture = create();
    http.expectOne((req) => req.url === '/api/jobs').flush(response([summary()]));
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Rechercher de nouvelles offres"]',
      ) as HTMLButtonElement
    ).click();

    http.expectOne('/api/ingestion/run').flush({
      fetched: 0,
      kept: 0,
      inserted: 0,
      updated: 0,
      merged: 0,
      purged: 0,
      skippedSources: [],
      failedSources: ['ADZUNA'],
    });
    http.expectOne((req) => req.url === '/api/jobs').flush(response([summary()]));
    http.expectOne('/api/ingestion/status').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('indisponible');
    expect(fixture.nativeElement.textContent).toContain('ADZUNA');
  });

  it('shows a message when the API is unreachable', () => {
    const fixture = create();
    http
      .expectOne((req) => req.url === '/api/jobs')
      .error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les offres');
  });
});
