import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { jobDetail, jobSummary } from '@core/jobs/job.fixtures';
import { JobPatchBus } from '@core/jobs/job-patch-bus';
import { useCleanStorage } from '@core/storage/storage.fixtures';
import { settle } from '@core/testing/testing.fixtures';

import { JobDetailPage } from './job-detail';

describe('JobDetailPage', () => {
  useFrenchTexts();
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
   * Opens the offer `id` in the panel.
   */
  async function open(id = 'job-1'): Promise<ComponentFixture<JobDetailPage>> {
    const fixture = TestBed.createComponent(JobDetailPage);
    fixture.componentRef.setInput('id', id);
    await settle(fixture);
    return fixture;
  }

  /**
   * Text of the rendered panel.
   */
  function text(fixture: ComponentFixture<JobDetailPage>): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('renders the offer and tells the feed it is now viewed', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(
      jobDetail({
        isViewed: true,
        salary: '45 k€',
        hasFullDescription: false,
        alternativeUrls: ['https://www.apec.fr/offre/1'],
      }),
    );
    await settle(fixture);

    expect(text(fixture)).toContain('Développeur Angular');
    expect(text(fixture)).toContain('Le Havre (76600)');
    expect(text(fixture)).toContain('45 k€');
    expect(text(fixture)).toContain('Concevoir les écrans');
    expect(text(fixture)).toContain("Cette source ne publie qu'un extrait.");
    expect(text(fixture)).toContain('apec.fr');
    expect(text(fixture)).toContain("Voir l'offre sur France Travail");
    expect(TestBed.inject(JobPatchBus).lastPatch()?.isViewed).toBe(true);
  });

  it('stars the offer and mirrors it to the feed', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    (fixture.nativeElement.querySelector('.job-detail__star') as HTMLButtonElement).click();
    http.expectOne('/api/jobs/job-1/favorite').flush(jobSummary({ isFavorite: true }));
    await settle(fixture);

    const star = fixture.nativeElement.querySelector('.job-detail__star') as HTMLElement;
    expect(star.getAttribute('aria-label')).toBe('Retirer des favoris');
    expect(TestBed.inject(JobPatchBus).lastPatch()?.isFavorite).toBe(true);
  });

  it('says why a star failed, and keeps the offer as it was', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    (fixture.nativeElement.querySelector('.job-detail__star') as HTMLButtonElement).click();
    http.expectOne('/api/jobs/job-1/favorite').flush(null, { status: 500, statusText: 'Error' });
    await settle(fixture);

    expect(text(fixture)).toContain('Impossible de modifier le favori.');
    const star = fixture.nativeElement.querySelector('.job-detail__star') as HTMLElement;
    expect(star.getAttribute('aria-label')).toBe('Ajouter aux favoris');
  });

  it('follows a star pressed on its row in the feed', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    TestBed.inject(JobPatchBus).publish(jobSummary({ isFavorite: true }));
    await settle(fixture);

    const star = fixture.nativeElement.querySelector('.job-detail__star') as HTMLElement;
    expect(star.getAttribute('aria-label')).toBe('Retirer des favoris');
  });

  it('ignores a star answered after another offer was opened', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    (fixture.nativeElement.querySelector('.job-detail__star') as HTMLButtonElement).click();
    fixture.componentRef.setInput('id', 'job-2');
    await settle(fixture);
    http.expectOne('/api/jobs/job-2').flush(jobDetail({ id: 'job-2', title: 'Autre offre' }));
    await settle(fixture);
    http.expectOne('/api/jobs/job-1/favorite').flush(jobSummary({ isFavorite: true }));
    await settle(fixture);

    const star = fixture.nativeElement.querySelector('.job-detail__star') as HTMLElement;
    expect(text(fixture)).toContain('Autre offre');
    expect(star.getAttribute('aria-label')).toBe('Ajouter aux favoris');
  });

  it('says so when the offer is gone, and goes back to the list', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await open('gone');
    http.expectOne('/api/jobs/gone').flush(null, { status: 404, statusText: 'Not Found' });
    await settle(fixture);

    expect(text(fixture)).toContain('Cette offre est introuvable.');
    (fixture.nativeElement.querySelector('app-empty-state button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/'], { queryParamsHandling: 'preserve' });
  });

  it('closes on Escape', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(navigate).toHaveBeenCalled();
  });

  it('asks again later when the offer could not load', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(null, { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    expect(text(fixture)).toContain('Impossible de charger cette offre');
  });
});
