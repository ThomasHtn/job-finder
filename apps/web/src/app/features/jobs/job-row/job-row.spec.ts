import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { JobSummary } from '@job-finder/shared';
import { LastVisitService } from '../../../core/last-visit.service';
import { JobRow } from './job-row';

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
    excerpt: null,
    isFavorite: false,
    isViewed: false,
    publishedAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    alternativeUrls: [],
    ...overrides,
  };
}

function create(job: JobSummary, previousVisitAt: string | null) {
  TestBed.configureTestingModule({
    imports: [JobRow],
    providers: [provideRouter([]), { provide: LastVisitService, useValue: { previousVisitAt } }],
  });
  const fixture = TestBed.createComponent(JobRow);
  fixture.componentRef.setInput('job', job);
  fixture.detectChanges();
  return fixture;
}

/**
 * One feed row in isolation.
 */
describe('JobRow', () => {
  it('flags an offer first seen after the previous visit as new', () => {
    const fixture = create(
      summary({ firstSeenAt: '2026-09-06T10:00:00.000Z' }),
      '2026-09-05T00:00:00.000Z',
    );

    expect(fixture.nativeElement.textContent).toContain('Nouveau');
  });

  it('does not flag an offer already present at the previous visit', () => {
    const fixture = create(
      summary({ firstSeenAt: '2026-09-01T10:00:00.000Z' }),
      '2026-09-05T00:00:00.000Z',
    );

    expect(fixture.nativeElement.textContent).not.toContain('Nouveau');
  });

  it('does not flag anything on the very first visit', () => {
    const fixture = create(summary(), null);

    expect(fixture.nativeElement.textContent).not.toContain('Nouveau');
  });
});
