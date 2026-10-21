import { TestBed } from '@angular/core/testing';

import { useCleanStorage } from '@core/storage/storage.fixtures';

import { LastVisit } from './last-visit';

describe('LastVisit', () => {
  useCleanStorage();

  it('knows no previous visit the first time, then stamps this one', () => {
    const visit = TestBed.inject(LastVisit);

    expect(visit.previousVisitAt).toBeNull();
    expect(localStorage.getItem('job-finder-last-visit')).not.toBeNull();
  });

  it('remembers the previous visit before stamping the new one', () => {
    localStorage.setItem('job-finder-last-visit', '2026-09-05T00:00:00.000Z');

    expect(TestBed.inject(LastVisit).previousVisitAt).toBe('2026-09-05T00:00:00.000Z');
  });
});
