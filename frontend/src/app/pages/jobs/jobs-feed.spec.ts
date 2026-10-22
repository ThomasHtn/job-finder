import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { JobTab } from '@job-finder/contract';

import { LOCALE_STORAGE_KEY } from '@core/i18n/i18n.constants';
import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { jobList, jobSummary } from '@core/jobs/job.fixtures';
import { JobPatchBus } from '@core/jobs/job-patch-bus';
import { useCleanStorage } from '@core/storage/storage.fixtures';
import { settle } from '@core/testing/testing.fixtures';

import { JobsFeed } from './jobs-feed';

describe('JobsFeed', () => {
  useFrenchTexts();
  useCleanStorage();

  let http: HttpTestingController;
  let bus: JobPatchBus;
  const tab = signal<JobTab>('local');

  beforeEach(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    tab.set('local');
    TestBed.configureTestingModule({
      providers: [JobPatchBus, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    bus = TestBed.inject(JobPatchBus);
  });

  afterEach(() => http.verify());

  /**
   * A feed on the tab signal, with its first request on the way.
   */
  async function create(): Promise<JobsFeed> {
    const feed = TestBed.runInInjectionContext(() => new JobsFeed(tab));
    feed.jobs();
    await settle();
    return feed;
  }

  /**
   * Answers the pending list request.
   */
  async function answer(jobs = [jobSummary()]): Promise<void> {
    http.expectOne((request) => request.url === '/api/jobs').flush(jobList(jobs));
    await settle();
  }

  it('lists the offers of the tab, with the counts and the last ingestion', async () => {
    const feed = await create();
    expect(feed.listed()).toBe(false);
    expect(feed.loading()).toBe(true);

    await answer();

    expect(feed.listed()).toBe(true);
    expect(feed.jobs().map((job) => job.id)).toEqual(['job-1']);
    expect(feed.counts()).toEqual({ local: 1, remote: 0, favorites: 0 });
    expect(feed.lastIngestionAt()).toBe('2026-09-03T10:00:00.000Z');
  });

  it('fetches the offers again when the tab changes', async () => {
    const feed = await create();
    await answer();

    tab.set('remote');
    await settle();
    const request = http.expectOne((req) => req.url === '/api/jobs');

    expect(request.request.params.get('tab')).toBe('remote');
    request.flush(jobList([]));
    await settle();
    expect(feed.jobs()).toEqual([]);
  });

  it('applies a change published before the list arrived', async () => {
    const feed = await create();
    bus.publish(jobSummary({ isFavorite: true }));

    await answer();

    expect(feed.jobs()[0].isFavorite).toBe(true);
    expect(feed.counts()?.favorites).toBe(1);
  });

  it('keeps every change when a list loaded before them arrives, or the list is fetched again', async () => {
    const feed = await create();
    bus.publish(jobSummary({ id: 'job-1', isFavorite: true }));
    bus.publish(jobSummary({ id: 'job-2', isFavorite: true }));

    await answer([jobSummary(), jobSummary({ id: 'job-2' })]);
    feed.reload();
    await settle();
    await answer([jobSummary(), jobSummary({ id: 'job-2' })]);

    expect(feed.jobs().map((job) => job.isFavorite)).toEqual([true, true]);
    expect(feed.counts()?.favorites).toBe(2);
  });

  it('publishes the answer of a star as a change, without fetching the list again', async () => {
    const feed = await create();
    await answer();

    const starring = feed.toggleFavorite('job-1');
    const request = http.expectOne('/api/jobs/job-1/favorite');
    expect(request.request.body).toEqual({ isFavorite: true });
    request.flush(jobSummary({ isFavorite: true }));
    await starring;

    expect(feed.jobs()[0].isFavorite).toBe(true);
    expect(bus.patches().get('job-1')?.isFavorite).toBe(true);
  });

  it('asks for nothing when the offer starred is no longer listed', async () => {
    const feed = await create();
    await answer();

    await feed.toggleFavorite('gone');

    http.expectNone('/api/jobs/gone/favorite');
  });

  it('leaves a failed star to the caller', async () => {
    const feed = await create();
    await answer();

    const starring = feed.toggleFavorite('job-1');
    http.expectOne('/api/jobs/job-1/favorite').flush(null, { status: 500, statusText: 'Error' });

    await expect(starring).rejects.toBeDefined();
    expect(feed.jobs()[0].isFavorite).toBe(false);
  });

  it('blocks on an error when the tab has nothing to show, and only warns when it has', async () => {
    const feed = await create();
    await answer();
    expect(feed.error()).toBeNull();

    feed.reload();
    await settle();
    http
      .expectOne((request) => request.url === '/api/jobs')
      .flush(null, { status: 502, statusText: 'Bad Gateway' });
    await settle();
    expect(feed.error()).toBeNull();
    expect(feed.reloadError()).toContain('Impossible de charger les offres');

    tab.set('remote');
    await settle();
    http
      .expectOne((request) => request.url === '/api/jobs')
      .flush(null, { status: 502, statusText: 'Bad Gateway' });
    await settle();
    expect(feed.error()).toContain('Impossible de charger les offres');
    expect(feed.reloadError()).toBeNull();
  });
});
