import { TestBed } from '@angular/core/testing';

import { jobSummary } from './job.fixtures';
import { JobPatchBus } from './job-patch-bus';

describe('JobPatchBus', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [JobPatchBus] }));

  it('starts empty', () => {
    expect(TestBed.inject(JobPatchBus).patches().size).toBe(0);
  });

  it('keeps every offer published, not only the last one', () => {
    const bus = TestBed.inject(JobPatchBus);

    bus.publish(jobSummary({ id: 'a', isFavorite: true }));
    bus.publish(jobSummary({ id: 'b', isViewed: true }));

    expect([...bus.patches().keys()]).toEqual(['a', 'b']);
  });

  it('keeps the latest state of an offer published twice', () => {
    const bus = TestBed.inject(JobPatchBus);

    bus.publish(jobSummary({ id: 'a', isFavorite: true }));
    bus.publish(jobSummary({ id: 'a', isFavorite: false }));

    expect(bus.patches().size).toBe(1);
    expect(bus.patches().get('a')?.isFavorite).toBe(false);
  });
});
