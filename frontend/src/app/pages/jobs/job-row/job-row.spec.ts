import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { JobSummary } from '@job-finder/contract';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';
import { jobSummary } from '@core/jobs/job.fixtures';
import { LastVisit } from '@core/jobs/last-visit';

import { JobRow } from './job-row';

/**
 * Renders one row as if the previous visit happened at the given time.
 */
function create(job: JobSummary, previousVisitAt: string | null) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: LastVisit, useValue: { previousVisitAt } }],
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
  useFrenchTexts();

  it('flags an offer first seen after the previous visit as new', () => {
    const fixture = create(
      jobSummary({ firstSeenAt: '2026-09-06T10:00:00.000Z' }),
      '2026-09-05T00:00:00.000Z',
    );

    expect(fixture.nativeElement.textContent).toContain('Nouveau');
    expect(fixture.nativeElement.classList).toContain('job-row--new');
  });

  it('does not flag an offer already present at the previous visit', () => {
    const fixture = create(
      jobSummary({ firstSeenAt: '2026-09-01T10:00:00.000Z' }),
      '2026-09-05T00:00:00.000Z',
    );

    expect(fixture.nativeElement.textContent).not.toContain('Nouveau');
  });

  it('does not flag anything on the very first visit', () => {
    const fixture = create(jobSummary(), null);

    expect(fixture.nativeElement.textContent).not.toContain('Nouveau');
  });

  it('shows only an unusual contract wording, and the salary in thousands', () => {
    const fixture = create(jobSummary({ contractLabel: 'Full-time', salary: '45 k€' }), null);

    expect(fixture.nativeElement.textContent).toContain('Full-time');
    expect(fixture.nativeElement.textContent).toContain('45K €');
  });

  it('keeps the source wording of a salary with no amount to shorten', () => {
    const fixture = create(jobSummary({ salary: 'A négocier' }), null);

    expect(fixture.nativeElement.textContent).toContain('A négocier');
  });

  it('says when the salary is not stated', () => {
    const fixture = create(jobSummary({ salary: null }), null);

    expect(fixture.nativeElement.textContent).toContain('Non communiqué');
  });

  it('names the first keywords of the searched stack', () => {
    const stack = ['Angular', 'Java', 'Spring Boot', 'PostgreSQL'];
    const fixture = create(jobSummary({ stack }), null);

    expect(fixture.nativeElement.textContent).toContain('Angular, Java, Spring Boot');
    expect(fixture.nativeElement.textContent).not.toContain('PostgreSQL');
  });

  it('emits the star press without opening the offer', () => {
    const fixture = create(jobSummary(), null);
    const starred: string[] = [];
    fixture.componentInstance.favoriteToggled.subscribe((id) => starred.push(id));

    (fixture.nativeElement.querySelector('.job-row__star') as HTMLButtonElement).click();

    expect(starred).toEqual(['job-1']);
  });
});
