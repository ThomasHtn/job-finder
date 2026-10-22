import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { Language } from '@core/i18n/language';
import { jobDetail, jobSummary } from '@core/jobs/job.fixtures';
import { JobPatchBus } from '@core/jobs/job-patch-bus';
import { Viewport } from '@core/layout/viewport';
import { useCleanStorage } from '@core/storage/storage.fixtures';
import { settle } from '@core/testing/testing.fixtures';

import { JobDetailPage } from './job-detail';
import { DISMISS_DISTANCE_PX } from './job-detail.constants';

describe('JobDetailPage', () => {
  useFrenchTexts();
  useCleanStorage();

  let http: HttpTestingController;

  /**
   * Whether the panel renders as a phone sheet, set before a spec opens it.
   */
  const compact = signal(false);

  beforeEach(() => {
    compact.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        JobPatchBus,
        { provide: Viewport, useValue: { isCompact: compact } },
      ],
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

  it('draws a placeholder shaped like the offer while it loads', async () => {
    const fixture = await open();
    const panel = fixture.nativeElement as HTMLElement;

    expect(panel.querySelector('.job-detail__placeholder')).not.toBeNull();
    expect(text(fixture)).toContain("Chargement de l'offre");

    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);
    expect(panel.querySelector('.job-detail__placeholder')).toBeNull();
  });

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
    expect(TestBed.inject(JobPatchBus).patches().get('job-1')?.isViewed).toBe(true);
  });

  it('stars the offer and mirrors it to the feed', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    (fixture.nativeElement.querySelector('.job-detail__star') as HTMLButtonElement).click();
    const request = http.expectOne('/api/jobs/job-1/favorite');
    expect(request.request.body).toEqual({ isFavorite: true });
    request.flush(jobSummary({ isFavorite: true }));
    await settle(fixture);

    const star = fixture.nativeElement.querySelector('.job-detail__star') as HTMLElement;
    expect(star.getAttribute('aria-label')).toBe('Retirer des favoris');
    expect(TestBed.inject(JobPatchBus).patches().get('job-1')?.isFavorite).toBe(true);
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
    expect(navigate).toHaveBeenCalledWith(['/'], {
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  });

  it('closes on Escape', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(navigate).toHaveBeenCalledWith(['/'], {
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  });

  it('leaves an Escape already taken, by the settings menu for instance', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    const taken = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    taken.preventDefault();
    document.dispatchEvent(taken);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('is a labelled modal dialog as a sheet, and a plain column otherwise', async () => {
    compact.set(true);
    const fixture = await open();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('dialog');
    expect(host.getAttribute('aria-modal')).toBe('true');
    expect(host.getAttribute('aria-label')).toBe("Chargement de l'offre…");

    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);
    expect(host.getAttribute('aria-label')).toBe('Développeur Angular');

    compact.set(false);
    await settle(fixture);
    expect(host.hasAttribute('role')).toBe(false);
    expect(host.hasAttribute('aria-modal')).toBe(false);
    expect(host.hasAttribute('aria-label')).toBe(false);
  });

  it('takes the focus when a narrowing window turns the column into a sheet', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);
    const close = fixture.nativeElement.querySelector('.job-detail__close');
    expect(document.activeElement).not.toBe(close);

    compact.set(true);
    await settle(fixture);

    expect(document.activeElement).toBe(close);
  });

  it('words a failed star in the language picked afterwards', async () => {
    localStorage.setItem('job-finder-locale', 'fr');
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);
    (fixture.nativeElement.querySelector('.job-detail__star') as HTMLButtonElement).click();
    http.expectOne('/api/jobs/job-1/favorite').flush(null, { status: 500, statusText: 'Error' });
    await settle(fixture);
    expect(text(fixture)).toContain('Impossible de modifier le favori.');

    await TestBed.inject(Language).use('en');
    await settle(fixture);

    expect(text(fixture)).toContain('Could not update the favorite.');
    expect(text(fixture)).not.toContain('Impossible de modifier');
  });

  it('keeps following the stars published in a row, one after the other', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);
    const bus = TestBed.inject(JobPatchBus);

    bus.publish(jobSummary({ isFavorite: true }));
    bus.publish(jobSummary({ isFavorite: false }));
    bus.publish(jobSummary({ id: 'other', isFavorite: true }));
    await settle(fixture);

    const star = fixture.nativeElement.querySelector('.job-detail__star') as HTMLElement;
    expect(star.getAttribute('aria-label')).toBe('Ajouter aux favoris');
  });

  it('takes the focus as a sheet over the feed, and leaves it alone in the column', async () => {
    compact.set(true);
    const sheet = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(sheet);
    expect(document.activeElement).toBe(sheet.nativeElement.querySelector('.job-detail__close'));
    sheet.destroy();

    compact.set(false);
    const column = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(column);
    expect(document.activeElement).not.toBe(
      column.nativeElement.querySelector('.job-detail__close'),
    );
  });

  /**
   * Drags the sheet handle from y=100 down by `distance` pixels and lets go.
   */
  async function drag(fixture: ComponentFixture<JobDetailPage>, distance: number): Promise<void> {
    const bar = fixture.nativeElement.querySelector('.job-detail__bar') as HTMLElement;
    bar.setPointerCapture = vi.fn();
    bar.dispatchEvent(new MouseEvent('pointerdown', { clientY: 100 }));
    bar.dispatchEvent(new MouseEvent('pointermove', { clientY: 100 + distance }));
    await settle(fixture);
    bar.dispatchEvent(new MouseEvent('pointerup'));
    await settle(fixture);
  }

  it('closes a sheet pulled down past the threshold', async () => {
    compact.set(true);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    await drag(fixture, DISMISS_DISTANCE_PX + 1);

    expect(navigate).toHaveBeenCalledWith(['/'], {
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  });

  it('springs a sheet pulled down a little back into place', async () => {
    compact.set(true);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    await drag(fixture, DISMISS_DISTANCE_PX - 1);

    expect(navigate).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).style.transform).toBe('');
  });

  it('cannot be dragged in the column', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(jobDetail());
    await settle(fixture);

    await drag(fixture, DISMISS_DISTANCE_PX + 1);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('asks again later when the offer could not load', async () => {
    const fixture = await open();
    http.expectOne('/api/jobs/job-1').flush(null, { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    expect(text(fixture)).toContain('Impossible de charger cette offre');
  });
});
