import { TestBed } from '@angular/core/testing';

import { Clock } from './clock';
import { CLOCK_TICK_MS } from './date.constants';

describe('Clock', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date('2026-10-21T10:00:00.000Z') }));
  afterEach(() => vi.useRealTimers());

  it('moves every minute, so relative labels age', () => {
    const clock = TestBed.inject(Clock);
    expect(clock.now().toISOString()).toBe('2026-10-21T10:00:00.000Z');

    vi.advanceTimersByTime(CLOCK_TICK_MS);

    expect(clock.now().toISOString()).toBe('2026-10-21T10:01:00.000Z');
  });
});
