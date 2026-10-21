import { describe, expect, it } from 'vitest';

import { toDate } from './to-date.js';

/**
 * Publication dates as the boards send them.
 */
describe('toDate', () => {
  it('reads ISO strings and epoch milliseconds', () => {
    expect(toDate('2026-10-20T08:00:00Z')?.toISOString()).toBe('2026-10-20T08:00:00.000Z');
    expect(toDate(Date.UTC(2026, 9, 20))?.toISOString()).toBe('2026-10-20T00:00:00.000Z');
  });

  it('treats a missing or unparseable date as unknown', () => {
    expect(toDate(undefined)).toBeNull();
    expect(toDate(null)).toBeNull();
    expect(toDate('')).toBeNull();
    expect(toDate('hier')).toBeNull();
  });
});
